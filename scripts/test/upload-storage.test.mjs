// putObjectStream / getObject on the Replit driver, against a fake client that behaves like @replit/object-storage:
// uploadFromStream is `stream.pipe(dest).on('error', reject).on('finish', resolve)`, so a SOURCE error never settles it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable, Writable } from 'node:stream';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

process.env.STORAGE_DRIVER = 'replit';
const origEmit = process.emitWarning;
process.emitWarning = (w, ...r) => (/MODULE_TYPELESS|Module type/.test(typeof w === 'string' ? w : w?.message || '') ? undefined : origEmit.call(process, w, ...r));
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const storage = await import(pathToFileURL(path.join(root, 'src/lib/storage.js')).href);

const uncaught = [];
process.on('uncaughtException', (e) => uncaught.push(e));
process.on('unhandledRejection', (e) => uncaught.push(e));

function fakeClient({ onWritten } = {}) {
  const stored = new Map();
  return {
    stored,
    uploadFromStream(name, stream) {
      return new Promise((resolve, reject) => {
        const chunks = [];
        const dest = new Writable({ write(c, _e, cb) { chunks.push(c); setTimeout(cb, 20); } }); // slow destination
        stream.pipe(dest).on('error', reject).on('finish', () => { stored.set(name, Buffer.concat(chunks)); onWritten?.(); resolve(); });
      });
    },
    async downloadAsBytes(name) {
      if (name === 'missing') return { ok: false, error: { message: 'No such object', statusCode: 404 } };
      if (name === 'flaky') return { ok: false, error: { message: 'backend unavailable', statusCode: 503 } };
      return { ok: true, value: [Buffer.from('hello')] };
    },
    async exists(name) { return name === 'boom' ? { ok: false, error: { message: 'x' } } : { ok: true, value: name !== 'missing' }; },
  };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const failingSource = () => Readable.from((async function* () { yield Buffer.alloc(1024); await sleep(30); throw new Error('part 1 unreadable'); })());

test('harness fidelity: the raw SDK-style upload never settles when the source errors', async () => {
  const c = fakeClient();
  const raw = failingSource(); raw.on('error', () => {}); // (without this listener the bare SDK also raises an uncaughtException)
  const settled = await Promise.race([c.uploadFromStream('k', raw).then(() => 'resolved', () => 'rejected'), sleep(400).then(() => 'hung')]);
  assert.equal(settled, 'hung');
});

test('putObjectStream rejects within 1 s when the source stream throws mid-stream, with no uncaught exception', async () => {
  storage.__setReplitClientForTests(fakeClient());
  const src = failingSource();
  const t0 = Date.now();
  await assert.rejects(storage.putObjectStream('docs/x/y.pdf', src), /part 1 unreadable/);
  assert.ok(Date.now() - t0 < 1000, `took ${Date.now() - t0} ms`);
  assert.equal(src.destroyed, true);
  await sleep(300);
  assert.deepEqual(uncaught, []);
});

test('putObjectStream still stores a healthy stream', async () => {
  const c = fakeClient(); storage.__setReplitClientForTests(c);
  await storage.putObjectStream('docs/ok.bin', Readable.from([Buffer.from('ab'), Buffer.from('cd')]));
  assert.equal(c.stored.get('docs/ok.bin').toString(), 'abcd');
  assert.deepEqual(uncaught, []);
});

test('getObject: 404 is null, any other failure throws, success returns the bytes', async () => {
  storage.__setReplitClientForTests(fakeClient());
  assert.equal(await storage.getObject('missing'), null);
  await assert.rejects(storage.getObject('flaky'), /read failed/);
  assert.equal((await storage.getObject('present')).toString(), 'hello');
});

test('objectExists throws on a storage error instead of reporting "absent"', async () => {
  storage.__setReplitClientForTests(fakeClient());
  assert.equal(await storage.objectExists('missing'), false);
  assert.equal(await storage.objectExists('there'), true);
  await assert.rejects(storage.objectExists('boom'), /exists check failed/);
});

const ex = await import(pathToFileURL(path.join(root, 'src/lib/pdf-text.js')).href);
const ac = await import(pathToFileURL(path.join(root, 'src/lib/after-commit.js')).href);

test('PDF extraction is serialized process-wide (never two at once, in order, survives a failure)', async () => {
  let running = 0, peak = 0; const order = [];
  const job = (n, fail) => ex.runExclusive(async () => {
    running++; peak = Math.max(peak, running); order.push(n);
    await sleep(30); running--;
    if (fail) throw new Error('boom');
    return n;
  });
  const results = await Promise.allSettled([job(1), job(2, true), job(3), job(4)]);
  assert.equal(peak, 1);
  assert.deepEqual(order, [1, 2, 3, 4]);
  assert.deepEqual(results.map((r) => r.status), ['fulfilled', 'rejected', 'fulfilled', 'fulfilled']);
});

test('extractPdfText still extracts text and caps pages', async () => {
  // One page containing "Quokka ledger", plus a 1 MB padding stream (pdf.js 1.10 mis-reads xref tables of tiny files).
  const content = 'BT /F1 24 Tf 72 700 Td (Quokka ledger) Tj ET';
  const pad = 'A'.repeat(1024 * 1024);
  const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${pad.length} >>\nstream\n${pad}\nendstream`];
  let s = '%PDF-1.4\n'; const offs = [];
  objs.forEach((o, i) => { offs.push(s.length); s += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = s.length;
  s += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF\n`;
  const out = Buffer.from(s, 'latin1');
  const texts = await Promise.all([1, 2, 3].map(() => ex.extractPdfText(Buffer.from(out))));
  assert.deepEqual(texts, ['Quokka ledger', 'Quokka ledger', 'Quokka ledger']);
});

test('extraction queue admits 1 running + 3 waiting, then refuses with a 503; released slots are reusable', () => {
  const tickets = [1, 2, 3, 4].map(() => ex.reserveExtraction());
  assert.throws(() => ex.reserveExtraction(), (e) => e.status === 503 && e.expose === true && /Retry save/.test(e.message));
  tickets[0].release(); tickets[0].release(); // idempotent
  const again = ex.reserveExtraction();
  assert.throws(() => ex.reserveExtraction(), /busy/);
  [...tickets.slice(1), again].forEach((x) => x.release());
});

test('a PDF longer than 150 pages is indexed up to 150 and reports truncation', async () => {
  const pages = 160; const pad = 'A'.repeat(1024 * 1024); const objs = [];
  const kids = Array.from({ length: pages }, (_, i) => `${4 + i} 0 R`).join(' ');
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>'; objs[2] = `<< /Type /Pages /Kids [${kids}] /Count ${pages} >>`; objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  for (let i = 0; i < pages; i++) objs[4 + i] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${4 + pages + i} 0 R /Resources << /Font << /F1 3 0 R >> >> >>`;
  for (let i = 0; i < pages; i++) { const c = `BT /F1 12 Tf 72 700 Td (page${i + 1}) Tj ET`; objs[4 + pages + i] = `<< /Length ${c.length} >>\nstream\n${c}\nendstream`; }
  objs.push(`<< /Length ${pad.length} >>\nstream\n${pad}\nendstream`);
  let s = '%PDF-1.4\n'; const offs = [];
  for (let k = 1; k < objs.length; k++) { offs[k] = s.length; s += `${k} 0 obj\n${objs[k]}\nendobj\n`; }
  const x = s.length; const n = objs.length;
  s += `xref\n0 ${n}\n0000000000 65535 f \n${offs.slice(1).map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${n} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF\n`;
  const info = await ex.extractPdfTextInfo(Buffer.from(s, 'latin1'));
  assert.equal(info.truncated, true);
  assert.match(info.text, /page150\b/); assert.doesNotMatch(info.text, /page151\b/);
});

test('afterCommit swallows (and logs) a failing audit/revalidate step', async () => {
  const errs = []; const orig = console.error; console.error = (...a) => errs.push(a.join(' '));
  try {
    await ac.afterCommit('audit', async () => { throw new Error('audit_log insert failed'); });
    await ac.afterCommit('ok', async () => {});
  } finally { console.error = orig; }
  assert.equal(errs.length, 1);
  assert.match(errs[0], /audit failed: audit_log insert failed/);
});

test('the test hook refuses to run in a deployment', () => {
  process.env.REPLIT_DEPLOYMENT = '1';
  try { assert.throws(() => storage.__setReplitClientForTests({}), /must not be used in a deployment/); }
  finally { delete process.env.REPLIT_DEPLOYMENT; }
});
