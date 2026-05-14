'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.role !== 'ADMIN') {
          setError('Tipe akun tidak valid. Gunakan portal login Peserta.');
        } else {
          router.push(data.redirectUrl);
          router.refresh();
        }
      } else {
        setError(data.error || 'Login gagal');
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      background: '#0D0D0F',
    }}>
      {/* Ambient glow — gold dominant for admin */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(212,162,76,0.12), transparent 60%), radial-gradient(ellipse 50% 50% at 20% 100%, rgba(255,43,43,0.07), transparent 55%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent)',
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: '420px',
        margin: '1rem',
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '1.5rem',
        padding: '2.5rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)',
      }}>
        {/* Gold top accent */}
        <div style={{ height: '3px', background: 'linear-gradient(90deg, var(--secondary), var(--primary))', marginBottom: '2rem', marginLeft: '-2.5rem', marginRight: '-2.5rem', marginTop: '-2.5rem', borderRadius: '1.5rem 1.5rem 0 0' }} />

        <div style={{ textAlign: 'center', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <Image 
            src="/logo_p2p.png" 
            alt="Logo P2P" 
            width={240} 
            height={60} 
            style={{ 
              filter: 'brightness(0) invert(1)', 
              opacity: 0.95,
              width: 'auto',
              height: 'auto',
              maxWidth: '100%',
              maxHeight: '60px',
              objectFit: 'contain'
            }} 
          />
        </div>

        <h1 style={{ marginBottom: '0.4rem', textAlign: 'center', fontSize: '1.5rem', fontWeight: 800, background: 'linear-gradient(135deg, #fff, rgba(212,162,76,0.9))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Portal Admin
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', textAlign: 'center', fontSize: '0.875rem' }}>
          Login aman untuk administrator.
        </p>

        {error && (
          <div style={{ background: 'rgba(255,43,43,0.1)', color: 'var(--error)', padding: '0.75rem 1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', border: '1px solid rgba(255,43,43,0.3)', fontSize: '0.875rem' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="username">Nama Pengguna Admin</label>
            <input id="username" type="text" className="input-field" value={username} onChange={e => setUsername(e.target.value)} required placeholder="Masukkan nama pengguna" />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="password">Kata Sandi</label>
            <input id="password" type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <button type="submit" className="btn" style={{
            width: '100%', marginTop: '0.5rem', padding: '0.9rem', fontSize: '1rem', fontWeight: 700,
            background: 'linear-gradient(135deg, var(--secondary), var(--secondary-hover))',
            color: '#1a0a00', boxShadow: '0 4px 15px rgba(212,162,76,0.25)',
          }} disabled={loading}>
            {loading ? '⏳ Mengautentikasi...' : 'Akses Dashboard →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    </main>
  );
}
