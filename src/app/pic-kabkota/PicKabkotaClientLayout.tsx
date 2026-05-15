'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function PicKabkotaClientLayout({ user, children }: any) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      window.location.href = '/api/auth/logout';
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', overflowX: 'hidden', background: 'var(--bg-color)' }}>
      <aside style={{
        width: '260px', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column',
        transition: 'transform 0.3s ease, margin-left 0.3s ease',
        transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        marginLeft: isSidebarOpen ? '0' : '-260px', flexShrink: 0, position: 'relative'
      }}>
        <div style={{ height: '3px', background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }} />
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--secondary)', marginBottom: '0.25rem' }}>
            PIC Kab/Kota
          </div>
          <h2 style={{ color: 'var(--text-main)', fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.01em' }}>{user.regencyCity}</h2>
        </div>
        <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <Link href="/pic-kabkota/dashboard" style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.75rem',
            fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(212,162,76,0.2)', textDecoration: 'none'
          }}>
            <span style={{ fontSize: '1rem' }}>📊</span> Dashboard
          </Link>
        </nav>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <header style={{
          padding: '1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10
        }}>
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} style={{
            padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}>
            <svg width="20" height="20" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="10" x2="21" y2="10" /><line x1="3" y1="5" x2="21" y2="5" /><line x1="3" y1="15" x2="21" y2="15" />
            </svg>
          </button>

          <div style={{ position: 'relative' }}>
            <div onClick={() => setDropdownOpen(!isDropdownOpen)} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.4rem 1rem 0.4rem 0.4rem',
              background: 'rgba(255,255,255,0.04)', borderRadius: '2rem', border: '1px solid rgba(255,255,255,0.08)', userSelect: 'none'
            }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.85rem'
              }}>{user.username[0].toUpperCase()}</div>
              <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>{user.username}</span>
            </div>

            {isDropdownOpen && (
              <>
                <div onClick={() => setDropdownOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9 }} />
                <div style={{
                  position: 'absolute', top: '110%', right: 0, background: 'rgba(20,20,28,0.95)', backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', overflow: 'hidden', minWidth: '160px', zIndex: 10
                }}>
                  <a href="/api/auth/logout" onClick={handleLogout} style={{ padding: '0.75rem 1rem', display: 'block', color: 'var(--error)', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>
                    ↩ Keluar
                  </a>
                </div>
              </>
            )}
          </div>
        </header>
        <div style={{ padding: '2rem', flex: 1 }}>{children}</div>
      </main>
    </div>
  );
}
