'use client';
import { useState, useEffect } from 'react';

type Participant = {
  id: string;
  username: string;
  regencyCity?: string | null;
  currentStage: number;
  progress?: {
    stage3Score?: number | null;
    stage6Score?: number | null;
    stage1Done: boolean;
    stage2Done: boolean;
    stage3Done: boolean;
    stage4Done: boolean;
    stage5Done: boolean;
    stage6Done: boolean;
  } | null;
  certificate?: object | null;
};

type DiscussionSession = {
  id: string;
  province: string;
  regencyCity: string;
  date: string;
};

type RegencyStat = {
  total: number;
  completed: number;
  inProgress: number;
  avgPre: number | null;
  avgPost: number | null;
  stage4Done: number;
};

export default function PicProvinsiDashboard() {
  const [users, setUsers] = useState<Participant[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionSession[]>([]);
  const [loading, setLoading] = useState(true);
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
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRegency || !editDate) return alert('Pilih Kabupaten/Kota dan tanggal');
    setSavingDate(true);
    const res = await fetch('/api/pic/discussion', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regencyCity: editingRegency, date: editDate })
    });
    if (res.ok) {
      alert('Tanggal diskusi berhasil diperbarui!');
      setEditingRegency(''); setEditDate('');
      fetchData();
    } else alert('Gagal memperbarui tanggal');
    setSavingDate(false);
  };

  const handleDownloadProvinsi = () => { window.location.href = '/api/pic/recap'; };
  const handleDownloadRegency = (rc: string) => { window.location.href = `/api/pic/recap?regencyCity=${encodeURIComponent(rc)}`; };

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>Memuat data...</div>;

  // Group by regencyCity
  const regencyStats: Record<string, RegencyStat> = {};
  users.forEach(u => {
    const rc = u.regencyCity || 'Tidak Diketahui';
    if (!regencyStats[rc]) regencyStats[rc] = { total: 0, completed: 0, inProgress: 0, avgPre: null, avgPost: null, stage4Done: 0 };
    regencyStats[rc].total++;
    if (u.certificate) regencyStats[rc].completed++;
    else regencyStats[rc].inProgress++;
    if (u.progress?.stage4Done) regencyStats[rc].stage4Done++;
  });

  // Compute averages
  Object.keys(regencyStats).forEach(rc => {
    const group = users.filter(u => (u.regencyCity || 'Tidak Diketahui') === rc);
    const preScores = group.filter(u => u.progress?.stage3Score !== null && u.progress?.stage3Score !== undefined).map(u => u.progress!.stage3Score!);
    const postScores = group.filter(u => u.progress?.stage6Score !== null && u.progress?.stage6Score !== undefined).map(u => u.progress!.stage6Score!);
    regencyStats[rc].avgPre = preScores.length > 0 ? +(preScores.reduce((a, b) => a + b, 0) / preScores.length).toFixed(1) : null;
    regencyStats[rc].avgPost = postScores.length > 0 ? +(postScores.reduce((a, b) => a + b, 0) / postScores.length).toFixed(1) : null;
  });

  const regencyNames = Object.keys(regencyStats).sort();
  const totalPeserta = users.length;
  const totalSelesai = users.filter(u => u.certificate).length;
  const totalKabKota = regencyNames.length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Dashboard PIC Provinsi</h1>
        <button onClick={handleDownloadProvinsi} className="btn btn-primary">📥 Unduh Rekap Provinsi (.xlsx)</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Kabupaten/Kota Aktif', value: totalKabKota, color: 'var(--secondary)' },
          { label: 'Total Peserta', value: totalPeserta, color: 'var(--gold-light)' },
          { label: 'Sudah Selesai', value: totalSelesai, color: '#4ade80' },
          { label: 'Dalam Proses', value: totalPeserta - totalSelesai, color: 'var(--primary)' },
        ].map(s => (
          <div key={s.label} className="glass-panel" style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>{s.label}</p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Edit Jadwal Diskusi */}
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>📅 Atur Jadwal Diskusi Tahap 4</h3>
        <form onSubmit={handleUpdateDiscussion} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <select value={editingRegency} onChange={e => setEditingRegency(e.target.value)} className="input-field" style={{ flex: 1, minWidth: '200px' }}>
            <option value="">-- Pilih Kabupaten/Kota --</option>
            {regencyNames.map(rc => <option key={rc} value={rc}>{rc}</option>)}
          </select>
          <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="input-field" style={{ flex: 1, minWidth: '180px' }} />
          <button type="submit" disabled={savingDate} className="btn btn-primary" style={{ minWidth: '140px' }}>
            {savingDate ? 'Menyimpan...' : 'Simpan Tanggal'}
          </button>
        </form>
      </div>

      {/* Tabel per Kabupaten/Kota */}
      <div className="glass-panel">
        <h3 style={{ color: 'var(--text-main)', marginBottom: '1.5rem' }}>Statistik & Rekapitulasi Kabupaten/Kota</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>No</th>
                <th style={{ padding: '0.75rem 1rem' }}>Kabupaten/Kota</th>
                <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Peserta</th>
                <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Selesai</th>
                <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>% Selesai</th>
                <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Diskusi (T4)</th>
                <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Rata Pre-Test</th>
                <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Rata Post-Test</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Jadwal Diskusi</th>
                <th style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>Unduh</th>
              </tr>
            </thead>
            <tbody>
              {regencyNames.map((rc, i) => {
                const stat = regencyStats[rc];
                const disc = discussions.find(d => d.regencyCity === rc);
                const pct = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
                return (
                  <tr key={rc} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-main)', fontWeight: 600 }}>{rc}</td>
                    <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', color: 'var(--gold-light)' }}>{stat.total}</td>
                    <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', color: stat.completed > 0 ? '#4ade80' : 'var(--text-muted)' }}>{stat.completed}</td>
                    <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                        <div style={{ width: '50px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#4ade80' : 'var(--secondary)', borderRadius: '3px' }} />
                        </div>
                        <span style={{ color: pct === 100 ? '#4ade80' : 'var(--text-muted)', fontSize: '0.75rem' }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', color: 'var(--text-muted)' }}>{stat.stage4Done}/{stat.total}</td>
                    <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', color: stat.avgPre !== null ? 'var(--gold-light)' : 'var(--text-muted)' }}>
                      {stat.avgPre !== null ? stat.avgPre : '-'}
                    </td>
                    <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', color: stat.avgPost !== null ? '#4ade80' : 'var(--text-muted)' }}>
                      {stat.avgPost !== null ? stat.avgPost : '-'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: disc ? 'var(--gold-light)' : 'var(--error)', fontSize: '0.8rem' }}>
                      {disc ? new Date(disc.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Belum Diatur'}
                    </td>
                    <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>
                      <button onClick={() => handleDownloadRegency(rc)} style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', background: 'transparent', border: '1px solid var(--secondary)', color: 'var(--secondary)', borderRadius: '0.5rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        📥 Unduh
                      </button>
                    </td>
                  </tr>
                );
              })}
              {regencyNames.length === 0 && (
                <tr><td colSpan={10} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada kabupaten/kota yang aktif.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
