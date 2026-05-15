'use client';
import { useState, useEffect } from 'react';

export default function PicProvinsiDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit discussion state
  const [editingRegency, setEditingRegency] = useState('');
  const [editDate, setEditDate] = useState('');
  const [savingDate, setSavingDate] = useState(false);

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
      if (Array.isArray(discData)) setDiscussions(discData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRegency || !editDate) return alert('Pilih Kabupaten/Kota dan tanggal');
    setSavingDate(true);
    try {
      const res = await fetch('/api/pic/discussion', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regencyCity: editingRegency, date: editDate })
      });
      if (res.ok) {
        alert('Tanggal diskusi berhasil diperbarui!');
        setEditingRegency('');
        setEditDate('');
        fetchData();
      } else alert('Gagal memperbarui tanggal');
    } catch (e) {
      alert('Terjadi kesalahan');
    }
    setSavingDate(false);
  };

  const handleDownloadProvinsi = () => {
    window.location.href = '/api/pic/recap';
  };

  const handleDownloadRegency = (regencyCity: string) => {
    window.location.href = `/api/pic/recap?regencyCity=${encodeURIComponent(regencyCity)}`;
  };

  if (loading) return <div>Memuat data...</div>;

  // Group users by regency
  const regencyStats: Record<string, { total: number, completed: number }> = {};
  users.forEach(u => {
    const rc = u.regencyCity || 'Tidak Diketahui';
    if (!regencyStats[rc]) regencyStats[rc] = { total: 0, completed: 0 };
    regencyStats[rc].total++;
    if (u.certificate) regencyStats[rc].completed++;
  });

  const regencyNames = Object.keys(regencyStats).sort();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Dashboard PIC Provinsi</h1>
        <button onClick={handleDownloadProvinsi} className="btn btn-primary">📥 Unduh Rekap Provinsi (.xlsx)</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 500 }}>Total Kabupaten/Kota Aktif</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--secondary)' }}>{regencyNames.length}</p>
        </div>
        <div className="glass-panel" style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 500 }}>Total Peserta</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--gold-light)' }}>{users.length}</p>
        </div>
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Atur Jadwal Diskusi Tahap 4 Kabupaten/Kota</h3>
        <form onSubmit={handleUpdateDiscussion} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <select value={editingRegency} onChange={e => setEditingRegency(e.target.value)} className="input-field" style={{ flex: 1, minWidth: '200px' }}>
            <option value="">-- Pilih Kabupaten/Kota --</option>
            {regencyNames.map(rc => <option key={rc} value={rc}>{rc}</option>)}
          </select>
          <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="input-field" style={{ flex: 1, minWidth: '200px' }} />
          <button type="submit" disabled={savingDate} className="btn btn-primary" style={{ minWidth: '150px' }}>
            {savingDate ? 'Menyimpan...' : 'Simpan Tanggal'}
          </button>
        </form>
      </div>

      <div className="glass-panel">
        <h3 style={{ color: 'var(--text-main)', marginBottom: '1.5rem' }}>Statistik Kabupaten/Kota</h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Kabupaten/Kota</th>
                <th style={{ padding: '0.75rem 1rem' }}>Peserta Terdaftar</th>
                <th style={{ padding: '0.75rem 1rem' }}>Lulus (Sertifikat)</th>
                <th style={{ padding: '0.75rem 1rem' }}>Jadwal Diskusi</th>
                <th style={{ padding: '0.75rem 1rem' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {regencyNames.map((rc, i) => {
                const stat = regencyStats[rc];
                const disc = discussions.find(d => d.regencyCity === rc);
                return (
                  <tr key={rc} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-main)', fontWeight: 600 }}>{rc}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{stat.total} Peserta</td>
                    <td style={{ padding: '0.75rem 1rem', color: stat.completed > 0 ? '#4ade80' : 'var(--text-muted)' }}>
                      {stat.completed} Lulus
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: disc ? 'var(--gold-light)' : 'var(--error)' }}>
                      {disc ? new Date(disc.date).toLocaleDateString('id-ID') : 'Belum Diatur'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <button onClick={() => handleDownloadRegency(rc)} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'transparent', border: '1px solid var(--secondary)', color: 'var(--secondary)' }}>
                        Unduh
                      </button>
                    </td>
                  </tr>
                );
              })}
              {regencyNames.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada kabupaten/kota yang aktif.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
