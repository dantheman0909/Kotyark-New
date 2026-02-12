import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import getDb from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const isAuth = await validateSession();
    if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { name, visibleInMenu, sortOrder } = await request.json();
    const db = getDb();

    const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(id);
    if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 });

    const updates = [];
    const values = [];

    if (name !== undefined) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      updates.push('name = ?', 'slug = ?');
      values.push(name, slug);
    }
    if (visibleInMenu !== undefined) {
      updates.push('visible_in_menu = ?');
      values.push(visibleInMenu ? 1 : 0);
    }
    if (sortOrder !== undefined) {
      updates.push('sort_order = ?');
      values.push(sortOrder);
    }

    if (updates.length > 0) {
      values.push(id);
      db.prepare(`UPDATE folders SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    const updated = db.prepare('SELECT * FROM folders WHERE id = ?').get(id);
    return NextResponse.json({ folder: updated });
  } catch (error) {
    console.error('Folder PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const isAuth = await validateSession();
    if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = getDb();

    const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(id);
    if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 });

    db.prepare('DELETE FROM folders WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Folder DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
