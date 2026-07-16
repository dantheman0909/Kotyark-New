import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import getDb from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Allowed upload types for the media library (images + common documents).
const ALLOWED_EXT = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv',
]);

export async function GET() {
  try {
    const db = getDb();
    const media = db.prepare('SELECT * FROM media ORDER BY created_at DESC').all();
    return NextResponse.json({ media });
  } catch (error) {
    console.error('Uploads GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const isAuth = await validateSession();
    if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'A file is required' }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return NextResponse.json({ error: `File type ${ext || '(unknown)'} is not allowed` }, { status: 400 });
    }

    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

    const id = uuidv4();
    const fileName = `${id}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(UPLOAD_DIR, fileName), buffer);

    const url = `/uploads/${fileName}`;
    const db = getDb();
    db.prepare(
      'INSERT INTO media (id, url, original_name, mime, size) VALUES (?, ?, ?, ?, ?)'
    ).run(id, url, file.name, file.type || '', buffer.length);

    const media = db.prepare('SELECT * FROM media WHERE id = ?').get(id);
    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    console.error('Uploads POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
