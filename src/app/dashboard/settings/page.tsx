'use client';
import { useState } from 'react';
import Link from 'next/link';

const MAX_SIZE_MB = 1;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export default function SettingsPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_SIZE_BYTES) {
      setMessage({ type: 'error', text: `Ukuran foto terlalu besar. Maksimal ${MAX_SIZE_MB}MB.` });
      e.target.value = '';
      return;
    }

    setAvatarFile(file);
    setMessage(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password && password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Kata sandi baru tidak cocok.' });
      return;
    }

    if (password && password.length < 6) {
      setMessage({ type: 'error', text: 'Kata sandi minimal 6 karakter.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/participant/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          password: password || undefined, 
          avatar: avatarPreview || undefined 
        })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan!' });
        setPassword('');
        setConfirmPassword('');
        setAvatarFile(null);
      } else {
        setMessage({ type: 'error', text: 'Gagal menyimpan pengaturan. Coba lagi.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan. Coba lagi.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <Link href="/dashboard" className="btn" style={{ display: 'inline-block', marginBottom: '2rem', padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)' }}>
        ← Kembali ke Dashboard
      </Link>
      
      <h1 style={{ marginBottom: '2rem' }}>Pengaturan Profil</h1>

      {message && (
        <div style={{ 
          padding: '0.875rem 1rem', borderRadius: '0.75rem', marginBottom: '1.5rem',
          background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(255,43,43,0.1)',
          border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(255,43,43,0.3)'}`,
          color: message.type === 'success' ? '#4ade80' : 'var(--error)',
          fontSize: '0.9rem'
        }}>
          {message.type === 'success' ? '✅ ' : '❌ '}{message.text}
        </div>
      )}
      
      <div className="glass-panel">
        <form onSubmit={handleSubmit}>

          {/* Foto Profil */}
          <div className="input-group">
            <label className="input-label">Foto Profil</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '0.75rem' }}>
              <div style={{ 
                width: '72px', height: '72px', borderRadius: '50%', 
                background: avatarPreview ? 'transparent' : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--border)', overflow: 'hidden', flexShrink: 0
              }}>
                {avatarPreview 
                  ? <img src={avatarPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '1.5rem', color: 'white' }}>👤</span>
                }
              </div>
              <div style={{ flex: 1 }}>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="input-field" 
                  style={{ padding: '0.5rem', fontSize: '0.875rem' }}
                />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  Format: JPG, PNG, WebP. Maksimal {MAX_SIZE_MB}MB.
                </p>
              </div>
            </div>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '1.5rem 0' }} />

          {/* Ganti Password */}
          <div className="input-group">
            <label className="input-label">Kata Sandi Baru</label>
            <input 
              type="password" 
              className="input-field" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Kosongkan jika tidak ingin mengubah kata sandi"
            />
          </div>

          <div className="input-group" style={{ marginTop: '1rem' }}>
            <label className="input-label">Konfirmasi Kata Sandi Baru</label>
            <input 
              type="password" 
              className="input-field" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              placeholder="Ulangi kata sandi baru"
              disabled={!password}
              style={{ opacity: !password ? 0.5 : 1 }}
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={saving || (!password && !avatarPreview)}
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
