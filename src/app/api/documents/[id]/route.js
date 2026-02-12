import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import getDb from '@/lib/db';
import path from 'path';
import fs from 'fs';

export async function PUT(request, { params }) {
  try {
    const isAuth = await validateSession();
    if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { title } = await request.json();
    const db = getDb();

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    if (title) {
      db.prepare('UPDATE documents SET title = ? WHERE id = ?').run(title, id);
    }

    const updated = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
    return NextResponse.json({ document: updated });
  } catch (error) {
    console.error('Document PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const isAuth = await validateSession();
    if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = getDb();

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    // Delete physical file if it's not external
    if (!doc.is_external && doc.file_path) {
      const filePath = path.join(process.cwd(), 'public', doc.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    db.prepare('DELETE FROM documents WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Document DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
