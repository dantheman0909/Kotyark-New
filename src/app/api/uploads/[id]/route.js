import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import getDb from '@/lib/db';
import path from 'path';
import fs from 'fs';

export async function DELETE(request, { params }) {
  try {
    const isAuth = await validateSession();
    if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = getDb();

    const item = db.prepare('SELECT * FROM media WHERE id = ?').get(id);
    if (!item) return NextResponse.json({ error: 'Media not found' }, { status: 404 });

    // Remove the physical file (url is like /uploads/<file>)
    if (item.url) {
      const filePath = path.join(process.cwd(), 'public', item.url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    db.prepare('DELETE FROM media WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Media DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
