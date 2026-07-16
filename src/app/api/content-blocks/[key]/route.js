import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import getDb from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { key } = await params;
    const db = getDb();
    const block = db.prepare('SELECT * FROM content_blocks WHERE key = ?').get(key);
    if (!block) return NextResponse.json({ error: 'Block not found' }, { status: 404 });
    return NextResponse.json({ block });
  } catch (error) {
    console.error('Content block GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const isAuth = await validateSession();
    if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { key } = await params;
    const { html, title } = await request.json();
    const db = getDb();

    const existing = db.prepare('SELECT * FROM content_blocks WHERE key = ?').get(key);
    if (existing) {
      db.prepare(
        "UPDATE content_blocks SET html = ?, updated_at = datetime('now') WHERE key = ?"
      ).run(html ?? existing.html, key);
    } else {
      db.prepare(
        'INSERT INTO content_blocks (key, title, html) VALUES (?, ?, ?)'
      ).run(key, title || key, html || '');
    }

    const block = db.prepare('SELECT * FROM content_blocks WHERE key = ?').get(key);
    return NextResponse.json({ block });
  } catch (error) {
    console.error('Content block PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
