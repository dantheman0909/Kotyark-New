import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import getDb from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'documents');

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');

    const db = getDb();
    let documents;

    if (folderId) {
      documents = db.prepare(
        'SELECT * FROM documents WHERE folder_id = ? ORDER BY created_at DESC'
      ).all(folderId);
    } else {
      documents = db.prepare(
        'SELECT d.*, f.name as folder_name, f.slug as folder_slug FROM documents d LEFT JOIN folders f ON d.folder_id = f.id ORDER BY d.created_at DESC'
      ).all();
    }

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Documents GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const isAuth = await validateSession();
    if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file');
    const title = formData.get('title');
    const folderId = formData.get('folderId');
    const externalUrl = formData.get('externalUrl');

    if (!folderId) {
      return NextResponse.json({ error: 'folderId is required' }, { status: 400 });
    }

    const db = getDb();

    // Verify folder exists
    const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(folderId);
    if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 });

    const id = uuidv4();

    if (externalUrl) {
      // External link (e.g. existing WIX hosted PDF)
      db.prepare(
        'INSERT INTO documents (id, folder_id, title, file_path, original_name, file_size, is_external) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(id, folderId, title || externalUrl, externalUrl, null, 0, 1);
    } else if (file) {
      // File upload
      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = path.extname(file.name);
      const fileName = `${id}${ext}`;
      const filePath = path.join(UPLOAD_DIR, fileName);

      fs.writeFileSync(filePath, buffer);

      db.prepare(
        'INSERT INTO documents (id, folder_id, title, file_path, original_name, file_size, is_external) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(id, folderId, title || file.name, `/documents/${fileName}`, file.name, buffer.length, 0);
    } else {
      return NextResponse.json({ error: 'Either file or externalUrl is required' }, { status: 400 });
    }

    const document = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Documents POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
