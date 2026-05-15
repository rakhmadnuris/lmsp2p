'use client';
import { useState, useEffect } from 'react';

type Participant = {
  id: string;
  username: string;
  currentStage: number;
  progress?: {
    stage1Notes?: string | null;
    stage1Done: boolean;
    stage2Notes?: string | null;
    stage2Done: boolean;
    stage3Score?: number | null;
    stage3Done: boolean;
    stage4Done: boolean;
    stage5Plan?: string | null;
    stage5Done: boolean;
    stage6Score?: number | null;
    stage6Done: boolean;
  } | null;
  certificate?: { fullName: string } | null;
};

const STAGES = [
  { key: 'stage1', label: 'Tahap 1', short: 'T1' },
  { key: 'stage2', label: 'Tahap 2', short: 'T2' },
  { key: 'stage3', label: 'Pre-Test', short: 'T3' },
  { key: 'stage4', label: 'Diskusi', short: 'T4' },
  { key: 'stage5', label: 'Tahap 5', short: 'T5' },
  { key: 'stage6', label: 'Post-Test', short: 'T6' },
  { key: 'stage7', label: 'Sertifikat', short: 'T7' },
];

function stageStatus(p: Participant) {
  const pr = p.progress;
  return {
    stage1: pr?.stage1Done ?? false,
    stage2: pr?.stage2Done ?? false,
    stage3: pr?.stage3Done ?? false,
    stage4: pr?.stage4Done ?? false,
    stage5: pr?.stage5Done ?? false,
    stage6: pr?.stage6Done ?? false,
    stage7: !!p.certificate,
  };
}

export default function PicKabkotaDashboard() {
  const [users, setUsers] = useState<Participant[]>([]);
  const [discussionDate, setDiscussionDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [adding, setAdding] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Participant | null>(null);

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
      if (Array.isArray(discData) && discData.length > 0) setDiscussionDate(discData[0].date);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdateDiscussion = async () => {
    if (!discussionDate) return alert('Pilih tanggal terlebih dahulu');
    const res = await fetch('/api/pic/discussion', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: discussionDate })
    });
    if (res.ok) alert('Tanggal diskusi berhasil diperbarui!');
    else alert('Gagal memperbarui tanggal');
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return alert('Isi username dan password');
    setAdding(true);
    const res = await fetch('/api/pic/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      alert('Peserta berhasil ditambahkan');
      setUsername(''); setPassword('');
      fetchData();
    } else alert(data.error || 'Gagal menambahkan peserta');
    setAdding(false);
  };

  const handleDownload = () => { window.location.href = '/api/pic/recap'; };

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>Memuat data...</div>;

  const totalSelesai = users.filter(u => u.certificate).length;

  const pill = (done: boolean, label: string) => (
    <span style={{
      display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
      background: done ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)',
      color: done ? '#4ade80' : 'var(--text-muted)',
      border: `1px solid ${done ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'}`,
    }}>{label}</span>
  );

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Dashboard PIC Kabupaten/Kota</h1>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Peserta', value: users.length, sub: 'dari maks. 40', color: 'var(--gold-light)' },
          { label: 'Sudah Selesai', value: totalSelesai, sub: 'peserta bersertifikat', color: '#4ade80' },
          { label: 'Dalam Proses', value: users.length - totalSelesai, sub: 'belum selesai', color: 'var(--secondary)' },
        ].map(s => (
          <div key={s.label} className="glass-panel" style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>{s.label}</p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.value}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Jadwal Diskusi */}
        <div className="glass-panel">
          <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>📅 Jadwal Diskusi Tahap 4</h3>
          <input type="date" value={discussionDate} onChange={e => setDiscussionDate(e.target.value)} className="input-field" style={{ marginBottom: '0.75rem' }} />
          <button onClick={handleUpdateDiscussion} className="btn btn-primary" style={{ width: '100%' }}>Simpan Tanggal</button>
        </div>

        {/* Tambah Peserta */}
        <div className="glass-panel">
          <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>➕ Tambah Peserta ({users.length}/40)</h3>
          <form onSubmit={handleAddParticipant}>
            <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="input-field" style={{ marginBottom: '0.5rem' }} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" style={{ marginBottom: '0.75rem' }} />
            <button type="submit" disabled={adding || users.length >= 40} className="btn" style={{ width: '100%', background: 'rgba(16,185,129,0.2)', color: '#4ade80', border: '1px solid rgba(16,185,129,0.4)' }}>
              {adding ? 'Menambahkan...' : users.length >= 40 ? 'Kuota Penuh (40/40)' : 'Tambah Peserta'}
            </button>
          </form>
        </div>
      </div>

      {/* Tabel Peserta */}
      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 style={{ color: 'var(--text-main)' }}>Daftar Peserta & Progres Lengkap</h3>
          <button onClick={handleDownload} className="btn btn-primary">📥 Unduh Rekap (.xlsx)</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>No</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Username</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Tahap</th>
                {STAGES.map(s => (
                  <th key={s.key} style={{ padding: '0.75rem 0.5rem', textAlign: 'center', minWidth: '52px' }}>{s.short}</th>
                ))}
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const status = stageStatus(u);
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-main)', fontWeight: 600 }}>{u.username}</td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: 'var(--gold-light)' }}>Tahap {u.currentStage}</td>
                    {Object.values(status).map((done, j) => (
                      <td key={j} style={{ padding: '0.5rem', textAlign: 'center' }}>
                        <span style={{ display: 'inline-block', width: '22px', height: '22px', borderRadius: '50%', lineHeight: '22px', fontSize: '0.7rem', fontWeight: 700, textAlign: 'center', background: done ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.05)', color: done ? '#4ade80' : 'var(--text-muted)', border: `1px solid ${done ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.1)'}` }}>
                          {done ? '✓' : '–'}
                        </span>
                      </td>
                    ))}
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                      <button onClick={() => setSelectedUser(selectedUser?.id === u.id ? null : u)} style={{ padding: '0.3rem 0.7rem', fontSize: '0.75rem', background: 'transparent', border: '1px solid var(--secondary)', color: 'var(--secondary)', borderRadius: '0.5rem', cursor: 'pointer' }}>
                        {selectedUser?.id === u.id ? 'Tutup' : 'Lihat'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr><td colSpan={10} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada peserta terdaftar.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        {selectedUser && (
          <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h4 style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>Detail Progres: {selectedUser.username}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              {[
                { label: '📖 Tahap 1 — Catatan Refleksi', done: selectedUser.progress?.stage1Done, value: selectedUser.progress?.stage1Notes },
                { label: '📝 Tahap 2 — Refleksi Lanjutan', done: selectedUser.progress?.stage2Done, value: selectedUser.progress?.stage2Notes },
                { label: '🧪 Tahap 3 — Pre-Test', done: selectedUser.progress?.stage3Done, value: selectedUser.progress?.stage3Score !== null && selectedUser.progress?.stage3Score !== undefined ? `Nilai: ${selectedUser.progress.stage3Score}` : undefined },
                { label: '💬 Tahap 4 — Diskusi', done: selectedUser.progress?.stage4Done, value: selectedUser.progress?.stage4Done ? 'Selesai mengikuti diskusi' : undefined },
                { label: '📋 Tahap 5 — RTL (Rencana Tindak Lanjut)', done: selectedUser.progress?.stage5Done, value: selectedUser.progress?.stage5Plan },
                { label: '🏆 Tahap 6 — Post-Test', done: selectedUser.progress?.stage6Done, value: selectedUser.progress?.stage6Score !== null && selectedUser.progress?.stage6Score !== undefined ? `Nilai: ${selectedUser.progress.stage6Score}` : undefined },
              ].map((item, idx) => (
                <div key={idx} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{item.label}</span>
                    {pill(!!item.done, item.done ? 'Selesai' : 'Belum')}
                  </div>
                  {item.value && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: 1.5 }}>{item.value}</p>}
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: selectedUser.certificate ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: `1px solid ${selectedUser.certificate ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
              <span style={{ fontWeight: 700, color: selectedUser.certificate ? '#4ade80' : 'var(--text-muted)' }}>
                {selectedUser.certificate ? '🎓 Sertifikat: Selesai' : '⏳ Sertifikat: Belum diperoleh'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
