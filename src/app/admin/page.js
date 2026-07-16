'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DocumentManager from '@/components/admin/DocumentManager';
import PageManager from '@/components/admin/PageManager';
import MediaLibrary from '@/components/admin/MediaLibrary';
import SiteContent from '@/components/admin/SiteContent';

const TABS = [
  { key: 'pages', label: 'Pages' },
  { key: 'documents', label: 'Documents' },
  { key: 'media', label: 'Media' },
  { key: 'site', label: 'Site Content' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pages');

  useEffect(() => {
    fetch('/api/auth/check')
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated) router.push('/login');
        else setLoading(false);
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="login-spinner" />
        <p>Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header-left">
          <h1>🗂 Content Manager</h1>
          <span className="admin-badge">Admin Panel</span>
        </div>
        <div className="admin-header-right">
          <a href="/" target="_blank" className="admin-link-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            View Public Site
          </a>
          <button onClick={handleLogout} className="admin-logout-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </header>

      <nav className="admin-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`admin-tabbtn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'pages' && <PageManager />}
      {tab === 'documents' && <DocumentManager />}
      {tab === 'media' && <MediaLibrary />}
      {tab === 'site' && <SiteContent />}
    </div>
  );
}
