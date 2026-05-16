'use client';
import { useState, useEffect } from 'react';

const AVATARS = ['👤','🦁','🐯','🦊','🐧','🦅','🌟','🔥','⚡','🌙'];

export default function PicKabkotaProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/pic/profile').then(r=>r.json()).then(setUser);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) return setMessage('Password baru tidak cocok!');
    setSaving(true); setMessage('');
    const res = await fetch('/api/pic/profile', {
      method: 'PATCH', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ currentPassword, newPassword: newPassword||undefined, avatar: user?.avatar }),
    });
    const data = await res.json();
    if (res.ok) { setMessage('Profil berhasil diperbarui!'); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }
    else setMessage(data.error || 'Gagal memperbarui profil.');
    setSaving(false);
  };

  if (!user) return <div style={{color:'var(--text-muted)',padding:'2rem'}}>Memuat...</div>;

  return (
    <div style={{maxWidth:'600px',margin:'0 auto'}}>
      <h1 style={{fontSize:'1.5rem',color:'var(--text-main)',marginBottom:'2rem'}}>⚙️ Pengaturan Profil</h1>
      <div className="glass-panel" style={{marginBottom:'1.5rem',textAlign:'center'}}>
        <div style={{fontSize:'4rem',marginBottom:'1rem'}}>{user.avatar || '👤'}</div>
        <div style={{fontWeight:700,fontSize:'1.1rem',color:'var(--text-main)'}}>{user.username}</div>
        <div style={{color:'var(--secondary)',fontSize:'0.8rem',marginBottom:'1rem'}}>PIC Kabupaten/Kota — {user.province} / {user.regencyCity}</div>
        <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',justifyContent:'center'}}>
          {AVATARS.map(a=>(
            <button key={a} onClick={()=>setUser({...user,avatar:a})} style={{fontSize:'1.5rem',padding:'0.4rem',background:user.avatar===a?'rgba(212,162,76,0.2)':'transparent',border:`2px solid ${user.avatar===a?'var(--secondary)':'rgba(255,255,255,0.1)'}`,borderRadius:'0.5rem',cursor:'pointer'}}>{a}</button>
          ))}
        </div>
      </div>
      <div className="glass-panel">
        <h3 style={{color:'var(--secondary)',marginBottom:'1.5rem'}}>Ubah Password</h3>
        <form onSubmit={handleSave} style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
          <div>
            <label className="input-label">Password Lama</label>
            <input type="password" className="input-field" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} placeholder="Password saat ini" />
          </div>
          <div>
            <label className="input-label">Password Baru</label>
            <input type="password" className="input-field" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Password baru" />
          </div>
          <div>
            <label className="input-label">Konfirmasi Password Baru</label>
            <input type="password" className="input-field" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Ulangi password baru" />
          </div>
          {message && (
            <div style={{padding:'0.75rem 1rem',borderRadius:'0.5rem',background:message.includes('berhasil')?'rgba(74,222,128,0.1)':'rgba(255,43,43,0.1)',color:message.includes('berhasil')?'#4ade80':'var(--error)',border:`1px solid ${message.includes('berhasil')?'rgba(74,222,128,0.3)':'rgba(255,43,43,0.3)'}`,fontSize:'0.875rem'}}>{message}</div>
          )}
          <button type="submit" disabled={saving} className="btn btn-primary">{saving?'Menyimpan...':'Simpan Perubahan'}</button>
        </form>
      </div>
    </div>
  );
}
