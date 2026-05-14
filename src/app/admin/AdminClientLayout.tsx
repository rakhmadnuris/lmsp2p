'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminClientLayout({ user, children }: any) {
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.confirm('Apakah Anda yakin ingin keluar dari akun administrator?')) {
      window.location.href = '/api/auth/logout?redirect=/admin/login';
    }
  };

  const navItems = [
    { href: '/admin/dashboard', label: 'Kemajuan Peserta', icon: '📊' },
    { href: '/admin/dashboard/answers', label: 'Jawaban Tahap 1-7', icon: '📋' },
    { href: '/admin/dashboard/register', label: 'Daftarkan Peserta', icon: '➕' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', overflowX: 'hidden', background: 'var(--bg-color)' }}>
      
      {/* ── Sidebar ── */}
      <aside style={{
        width: '260px',
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.3s ease, margin-left 0.3s ease',
        transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        marginLeft: isSidebarOpen ? '0' : '-260px',
        flexShrink: 0,
        position: 'relative',
      }}>
        {/* Gold top accent */}
        <div style={{ height: '3px', background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }} />

        {/* Brand */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--secondary)', marginBottom: '0.25rem' }}>
            Dashboard
          </div>
          <h2 style={{ color: 'var(--text-main)', fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.01em' }}>Admin P2P</h2>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                fontWeight: isActive(item.href) ? 600 : 400,
                fontSize: '0.9rem',
                color: isActive(item.href) ? 'var(--text-main)' : 'var(--text-muted)',
                background: isActive(item.href) ? 'rgba(255,255,255,0.07)' : 'transparent',
                border: isActive(item.href) ? '1px solid rgba(212,162,76,0.2)' : '1px solid transparent',
                transition: 'all 0.2s ease',
                textDecoration: 'none',
              }}
            >
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Bottom removed to avoid duplicate logout */}
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {/* Header */}
        <header style={{
          padding: '1rem 2rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            style={{
              padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <svg width="20" height="20" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="10" x2="21" y2="10" /><line x1="3" y1="5" x2="21" y2="5" /><line x1="3" y1="15" x2="21" y2="15" />
            </svg>
          </button>

          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setDropdownOpen(!isDropdownOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer',
                padding: '0.4rem 1rem 0.4rem 0.4rem',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '2rem', border: '1px solid rgba(255,255,255,0.08)',
                userSelect: 'none',
              }}
            >
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 700, fontSize: '0.85rem',
              }}>
                {user?.username?.[0]?.toUpperCase() || 'A'}
              </div>
              <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>{user.username}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: '0.2s' }}>▼</span>
            </div>

            {isDropdownOpen && (
              <>
                <div onClick={() => setDropdownOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9 }} />
                <div style={{
                  position: 'absolute', top: '110%', right: 0,
                  background: 'rgba(20,20,28,0.95)', backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem',
                  overflow: 'hidden', minWidth: '160px', zIndex: 10,
                  boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                }}>
                  <Link href="/api/auth/logout?redirect=/admin/login" onClick={handleLogout} style={{ padding: '0.75rem 1rem', display: 'block', color: 'var(--error)', fontWeight: 600, fontSize: '0.875rem' }}>
                    ↩ Keluar
                  </Link>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Content */}
        <div style={{ padding: '2rem', flex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
