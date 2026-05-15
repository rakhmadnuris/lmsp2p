'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import BackButtonHandler from './BackButtonHandler';

export default function DashboardClientLayout({ user, stages, children }: any) {
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Cache-Control';
    meta.content = 'no-cache, no-store, must-revalidate';
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari akun?')) {
      window.location.href = '/api/auth/logout';
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', overflowX: 'hidden', background: 'var(--bg-color)' }}>
      <BackButtonHandler />
      
      {/* ── Sidebar ── */}
      <aside style={{
        width: '260px',
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column',
        transition: 'transform 0.3s ease, margin-left 0.3s ease',
        transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        marginLeft: isSidebarOpen ? '0' : '-260px',
        flexShrink: 0,
      }}>
        <div style={{ height: '3px', background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }} />

        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--secondary)', marginBottom: '0.2rem' }}>
            P2P 2026
          </div>
          <h2 style={{ color: 'var(--text-main)', fontWeight: 800, fontSize: '1.1rem' }}>Ruang Belajar</h2>
        </div>

        <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', overflowY: 'auto' }}>
          <Link href="/dashboard" style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.65rem 1rem', borderRadius: '0.75rem',
            fontWeight: pathname === '/dashboard' ? 600 : 400,
            fontSize: '0.875rem',
            color: pathname === '/dashboard' ? 'var(--text-main)' : 'var(--text-muted)',
            background: pathname === '/dashboard' ? 'rgba(212,162,76,0.1)' : 'transparent',
            border: pathname === '/dashboard' ? '1px solid rgba(212,162,76,0.2)' : '1px solid transparent',
            transition: 'all 0.2s',
          }}>
            <span>🏠</span> Beranda
          </Link>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0.5rem 0' }} />

          {stages.map((s: any) => {
            const isCurrentStage = user.currentStage === s.num;
            const isDone = user.currentStage > s.num;
            const stageHref = `/stages/${s.num}`;
            const isActivePath = pathname === stageHref;

            if (s.locked) {
              return (
                <span key={s.num} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.65rem 1rem', borderRadius: '0.75rem',
                  fontSize: '0.875rem', opacity: 0.4, cursor: 'not-allowed',
                  color: 'var(--text-muted)',
                }}>
                  <span style={{ fontSize: '0.7rem' }}>🔒</span>
                  <span>{s.title}</span>
                </span>
              );
            }

            return (
              <Link key={s.num} href={stageHref} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.65rem 1rem', borderRadius: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: isActivePath ? 600 : 400,
                color: isActivePath ? 'var(--text-main)' : isDone ? 'var(--text-muted)' : isCurrentStage ? 'var(--gold-light)' : 'var(--text-muted)',
                background: isActivePath ? 'rgba(255,43,43,0.1)' : 'transparent',
                border: isActivePath ? '1px solid rgba(255,43,43,0.2)' : '1px solid transparent',
                transition: 'all 0.2s',
              }}>
                <span>{s.title}</span>
                {isDone && <span style={{ fontSize: '0.75rem', color: '#4ade80' }}>✓</span>}
                {isCurrentStage && !isDone && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--secondary)', display: 'inline-block' }} />}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <header style={{
          padding: '1rem 2rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(12px)',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} style={{
            padding: '0.5rem', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.5rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
          }}>
            <svg width="20" height="20" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="10" x2="21" y2="10" /><line x1="3" y1="5" x2="21" y2="5" /><line x1="3" y1="15" x2="21" y2="15" />
            </svg>
          </button>

          {/* User dropdown */}
          <div style={{ position: 'relative' }}>
            <div onClick={() => setDropdownOpen(!isDropdownOpen)} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer',
              padding: '0.4rem 1rem 0.4rem 0.4rem',
              background: 'rgba(255,255,255,0.04)', borderRadius: '2rem',
              border: '1px solid rgba(255,255,255,0.08)', userSelect: 'none',
            }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: user?.avatar ? 'transparent' : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 700, fontSize: '0.85rem',
                overflow: 'hidden',
              }}>
                {user?.avatar
                  ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : user?.username?.[0]?.toUpperCase() || 'P'
                }
              </div>
              <span style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.9rem' }}>{user.username}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: '0.2s' }}>▼</span>
            </div>

            {isDropdownOpen && (
              <>
                <div onClick={() => setDropdownOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9 }} />
                <div style={{
                  position: 'absolute', top: '110%', right: 0,
                  background: 'rgba(20,20,28,0.95)', backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem',
                  overflow: 'hidden', minWidth: '160px', zIndex: 10,
                  boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                }}>
                  {/* Pakai Link biasa untuk settings, bukan logout */}
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      padding: '0.75rem 1rem', display: 'block', color: 'var(--text-main)',
                      fontSize: '0.875rem', borderBottom: '1px solid rgba(255,255,255,0.05)',
                      textDecoration: 'none',
                    }}
                  >
                    👤 Pengaturan Profil
                  </Link>
                  {/* Pakai button untuk logout agar tidak navigate langsung */}
                  <button
                    onClick={() => { setDropdownOpen(false); handleLogout(); }}
                    style={{
                      padding: '0.75rem 1rem', display: 'block', width: '100%', textAlign: 'left',
                      color: 'var(--error)', fontWeight: 600, fontSize: '0.875rem',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                    }}
                  >
                    ↩ Keluar
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <div style={{ padding: '2rem', flex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
