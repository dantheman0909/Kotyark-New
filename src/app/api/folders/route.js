import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import getDb from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const db = getDb();
    const folders = db.prepare(
      'SELECT * FROM folders ORDER BY sort_order ASC, name ASC'
    ).all();
    return NextResponse.json({ folders });
  } catch (error) {
    console.error('Folders GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const isAuth = await validateSession();
    if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, parentId, visibleInMenu } = await request.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const db = getDb();
    const id = uuidv4();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Check for duplicate slug
    const existing = db.prepare('SELECT id FROM folders WHERE slug = ?').get(slug);
    if (existing) {
      return NextResponse.json({ error: 'A folder with this name already exists' }, { status: 409 });
    }

    db.prepare(
      'INSERT INTO folders (id, parent_id, name, slug, visible_in_menu) VALUES (?, ?, ?, ?, ?)'
    ).run(id, parentId || null, name, slug, visibleInMenu !== false ? 1 : 0);

    const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(id);
    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    console.error('Folders POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
