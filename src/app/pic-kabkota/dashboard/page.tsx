'use client';
import { useState, useEffect } from 'react';

export default function PicKabkotaDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [discussionDate, setDiscussionDate] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Add participant state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, discRes] = await Promise.all([
        fetch('/api/pic/users'),
        fetch('/api/pic/discussion')
      ]);
      const usersData = await usersRes.json();
      const discData = await discRes.json();
      
      if (Array.isArray(usersData)) setUsers(usersData);
      if (Array.isArray(discData) && discData.length > 0) {
        setDiscussionDate(discData[0].date);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateDiscussion = async () => {
    if (!discussionDate) return alert('Pilih tanggal terlebih dahulu');
    try {
      const res = await fetch('/api/pic/discussion', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: discussionDate })
      });
      if (res.ok) alert('Tanggal diskusi berhasil diperbarui!');
      else alert('Gagal memperbarui tanggal');
    } catch (e) {
      alert('Terjadi kesalahan');
    }
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return alert('Isi username dan password');
    setAdding(true);
    try {
      const res = await fetch('/api/pic/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Peserta berhasil ditambahkan');
        setUsername('');
        setPassword('');
        fetchData();
      } else {
        alert(data.error || 'Gagal menambahkan peserta');
      }
    } catch (e) {
      alert('Terjadi kesalahan');
    }
    setAdding(false);
  };

  const handleDownload = () => {
    window.location.href = '/api/pic/recap';
  };

  if (loading) return <div>Memuat data...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Dashboard PIC Kabupaten/Kota</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel">
          <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Jadwal Diskusi Tahap 4</h3>
          <input type="date" value={discussionDate} onChange={e => setDiscussionDate(e.target.value)} className="input-field" style={{ marginBottom: '1rem' }} />
          <button onClick={handleUpdateDiscussion} className="btn btn-primary" style={{ width: '100%' }}>Simpan Tanggal</button>
        </div>

        <div className="glass-panel">
          <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Tambah Peserta ({users.length}/40)</h3>
          <form onSubmit={handleAddParticipant}>
            <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="input-field" style={{ marginBottom: '0.5rem' }} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" style={{ marginBottom: '1rem' }} />
            <button type="submit" disabled={adding || users.length >= 40} className="btn" style={{ width: '100%', background: 'rgba(16,185,129,0.2)', color: '#4ade80', border: '1px solid rgba(16,185,129,0.4)' }}>
              {adding ? 'Menambahkan...' : 'Tambah Peserta'}
            </button>
          </form>
        </div>
      </div>

      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ color: 'var(--text-main)' }}>Daftar Peserta & Progres</h3>
          <button onClick={handleDownload} className="btn btn-primary">📥 Unduh Rekap (.xlsx)</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Username</th>
                <th style={{ padding: '0.75rem 1rem' }}>Tahap Saat Ini</th>
                <th style={{ padding: '0.75rem 1rem' }}>Sertifikat</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-main)' }}>{u.username}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--gold-light)' }}>Tahap {u.currentStage}</td>
                  <td style={{ padding: '0.75rem 1rem', color: u.certificate ? '#4ade80' : 'var(--text-muted)' }}>
                    {u.certificate ? 'Selesai' : 'Belum'}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={3} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada peserta terdaftar.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
