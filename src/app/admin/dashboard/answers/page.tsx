'use client';
import React, { useState, useEffect, useMemo } from 'react';
import regionsData from '@/lib/regions.json';

const PROVINCES = Object.keys(regionsData);

const MATERIALS = [
  'Mat 1: Pencegahan Pelanggaran',
  'Mat 2: Pelaporan Dugaan',
  'Mat 3: Sengketa Proses',
  'Mat 4: Pengawasan Partisipatif',
  'Mat 5: Jaringan & Komunitas',
  'Mat 6: Pengawasan Digital',
];

export default function AnswersPage() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProvince, setFilterProvince] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'ranking' | 'user'>('overview');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [sortField, setSortField] = useState<'stage3' | 'stage6'>('stage3');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => { fetchParticipants(); }, []);

  const fetchParticipants = async () => {
    try {
      const res = await fetch('/api/admin/participants');
      const data = await res.json();
      setParticipants(data);
    } catch (error) {
      console.error('Gagal mengambil data peserta', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProvinceFilter = (prov: string) => {
    setFilterProvince(prov);
    setFilterCity('');
    setAvailableCities(prov ? (regionsData as any)[prov] || [] : []);
  };

  const filtered = useMemo(() => {
    return participants.filter((p: any) => {
      if (filterProvince && p.province !== filterProvince) return false;
      if (filterCity && p.regencyCity !== filterCity) return false;
      return true;
    });
  }, [participants, filterProvince, filterCity]);

  const ranked = useMemo(() => {
    return [...filtered].sort((a: any, b: any) => {
      const aScore = sortField === 'stage3' ? (a.progress?.stage3Score ?? -1) : (a.progress?.stage6Score ?? -1);
      const bScore = sortField === 'stage3' ? (b.progress?.stage3Score ?? -1) : (b.progress?.stage6Score ?? -1);
      return bScore - aScore;
    });
  }, [filtered, sortField]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const completed = filtered.filter((p: any) => p.currentStage >= 7).length;
    const s3Scores = filtered.map((p: any) => p.progress?.stage3Score).filter((s: any) => s !== null && s !== undefined);
    const s6Scores = filtered.map((p: any) => p.progress?.stage6Score).filter((s: any) => s !== null && s !== undefined);
    const avgS3 = s3Scores.length > 0 ? Math.round(s3Scores.reduce((a: number, b: number) => a + b, 0) / s3Scores.length) : 0;
    const avgS6 = s6Scores.length > 0 ? Math.round(s6Scores.reduce((a: number, b: number) => a + b, 0) / s6Scores.length) : 0;
    const maleCount = filtered.filter((p: any) => p.gender === 'Male').length;
    const femaleCount = filtered.filter((p: any) => p.gender === 'Female').length;
    const stageCounts = [0, 0, 0, 0, 0, 0, 0, 0];
    filtered.forEach((p: any) => { if (p.currentStage >= 1 && p.currentStage <= 7) stageCounts[p.currentStage]++; });
    stageCounts[0] = completed;
    return { total, completed, avgS3, avgS6, maleCount, femaleCount, s3Scores, s6Scores, stageCounts };
  }, [filtered]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const params = new URLSearchParams();
      if (filterProvince) params.set('province', filterProvince);
      if (filterCity) params.set('city', filterCity);
      const res = await fetch(`/api/admin/export?${params.toString()}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `P2P_Rekap_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Gagal mengunduh ekspor.');
    } finally {
      setDownloading(false);
    }
  };

  const tabStyle = (active: boolean) => ({
    padding: '0.75rem 1.5rem',
    background: active ? 'var(--primary)' : '#FFFFFF',
    border: active ? 'none' : '1px solid var(--border)',
    color: active ? 'white' : 'var(--text-muted)',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontWeight: active ? 600 : 400,
    transition: 'all 0.2s',
    fontSize: '0.875rem',
  });

  const cardStyle = {
    background: 'var(--surface)',
    padding: '1.5rem',
    borderRadius: '0.75rem',
    border: '1px solid var(--border)',
    textAlign: 'center' as const,
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat data...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--primary)' }}>Jawaban Tahap 1–7 & Analitik</h1>
        <button onClick={handleDownload} className="btn" disabled={downloading} style={{ padding: '0.5rem 1.25rem', background: 'rgba(212, 162, 76, 0.15)', border: '1px solid var(--secondary)', color: 'var(--secondary)', fontWeight: 600 }}>
          {downloading ? 'Mengekspor...' : '📥 Unduh .xlsx'}
        </button>
      </div>

      {/* Filters */}
      <div className="glass-panel" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label className="input-label" style={{ marginBottom: '0.25rem' }}>Provinsi</label>
            <select className="input-field" value={filterProvince} onChange={e => handleProvinceFilter(e.target.value)} style={{ appearance: 'auto', padding: '0.5rem' }}>
              <option value="">Semua Provinsi</option>
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label className="input-label" style={{ marginBottom: '0.25rem' }}>Kabupaten/Kota</label>
            <select className="input-field" value={filterCity} onChange={e => setFilterCity(e.target.value)} disabled={!filterProvince} style={{ appearance: 'auto', padding: '0.5rem' }}>
              <option value="">Semua Kota</option>
              {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', paddingBottom: '0.5rem' }}>
            Menampilkan <strong style={{ color: 'var(--primary)' }}>{filtered.length}</strong> peserta
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button style={tabStyle(activeTab === 'overview')} onClick={() => setActiveTab('overview')}>📊 Ringkasan & Statistik</button>
        <button style={tabStyle(activeTab === 'ranking')} onClick={() => setActiveTab('ranking')}>🏆 Peringkat Nilai</button>
        <button style={tabStyle(activeTab === 'user')} onClick={() => setActiveTab('user')}>👤 Jawaban Individual</button>
      </div>

      {/* === OVERVIEW TAB === */}
      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.total}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Peserta</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>{stats.completed}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Selesai Program</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--secondary)' }}>{stats.avgS3}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rata-rata Pre-Test</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#06b6d4' }}>{stats.avgS6}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rata-rata Post-Test</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="glass-panel">
              <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)', fontSize: '1rem' }}>Distribusi Jenis Kelamin</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#3b82f6' }}></div>
                    <span>Laki-laki: <strong>{stats.maleCount}</strong></span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#ec4899' }}></div>
                    <span>Perempuan: <strong>{stats.femaleCount}</strong></span>
                  </div>
                </div>
                <div style={{ width: '180px', height: '24px', borderRadius: '12px', overflow: 'hidden', display: 'flex', background: 'var(--surface)' }}>
                  {stats.total > 0 && (
                    <>
                      <div style={{ width: `${(stats.maleCount / stats.total) * 100}%`, background: '#3b82f6', transition: 'width 0.5s' }}></div>
                      <div style={{ width: `${(stats.femaleCount / stats.total) * 100}%`, background: '#ec4899', transition: 'width 0.5s' }}></div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="glass-panel">
              <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)', fontSize: '1rem' }}>Perbandingan Pre-Test vs Post-Test</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2rem', justifyContent: 'center', height: '120px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--secondary)' }}>{stats.avgS3}</div>
                  <div style={{ width: '60px', height: `${Math.max(stats.avgS3, 5)}px`, background: 'linear-gradient(to top, var(--secondary), var(--gold-light))', borderRadius: '6px 6px 0 0', transition: 'height 0.5s' }}></div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Pre-Test</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#06b6d4' }}>{stats.avgS6}</div>
                  <div style={{ width: '60px', height: `${Math.max(stats.avgS6, 5)}px`, background: 'linear-gradient(to top, #06b6d4, #22d3ee)', borderRadius: '6px 6px 0 0', transition: 'height 0.5s' }}></div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Post-Test</div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel">
            <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)', fontSize: '1rem' }}>Distribusi Kemajuan Tahap</h3>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', justifyContent: 'center', height: '160px', paddingBottom: '2rem' }}>
              {[1,2,3,4,5,6,7].map(s => {
                const count = stats.stageCounts[s] || 0;
                const maxCount = Math.max(...stats.stageCounts.slice(1), 1);
                const barH = Math.max((count / maxCount) * 100, 4);
                const colors = ['var(--primary)','var(--secondary)','#f59e0b','var(--success)','#06b6d4','#ec4899','#22c55e'];
                return (
                  <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{count}</div>
                    <div style={{ width: '45px', height: `${barH}px`, background: colors[s-1], borderRadius: '6px 6px 0 0', transition: 'height 0.5s' }}></div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>T{s}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* === RANKING TAB === */}
      {activeTab === 'ranking' && (
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ color: 'var(--secondary)', fontSize: '1.25rem' }}>🏆 Peringkat Nilai</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button style={tabStyle(sortField === 'stage3')} onClick={() => setSortField('stage3')}>Pre-Test (T3)</button>
              <button style={tabStyle(sortField === 'stage6')} onClick={() => setSortField('stage6')}>Post-Test (T6)</button>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--primary)' }}>
                  <th style={{ padding: '0.75rem 1rem', width: '60px' }}>#</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Nama Pengguna</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Provinsi</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Kabupaten/Kota</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Nilai</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((p: any, i: number) => {
                  const score = sortField === 'stage3' ? p.progress?.stage3Score : p.progress?.stage6Score;
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', background: i < 3 ? 'rgba(255,43,43,0.04)' : 'transparent' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold' }}>
                        {i < 3 ? <span style={{ fontSize: '1.25rem' }}>{['🥇','🥈','🥉'][i]}</span> : i + 1}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: i < 3 ? 'bold' : 'normal' }}>{p.username}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{p.province}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{p.regencyCity}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem', color: score !== null && score !== undefined ? (score >= 70 ? 'var(--success)' : 'var(--error)') : 'var(--text-muted)' }}>
                        {score !== null && score !== undefined ? score : '–'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === INDIVIDUAL USER TAB === */}
      {activeTab === 'user' && (
        <div style={{ display: 'flex', gap: '1.5rem', height: 'calc(100vh - 320px)' }}>
          <div className="glass-panel" style={{ width: '260px', display: 'flex', flexDirection: 'column', padding: '1rem', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '0.75rem', color: 'var(--secondary)', fontSize: '1rem' }}>Peserta</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {filtered.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedUser(p)}
                  style={{
                    padding: '0.75rem',
                    background: selectedUser?.id === p.id ? 'var(--primary)' : '#FFFFFF',
                    border: '1px solid var(--border)',
                    borderRadius: '0.375rem',
                    color: selectedUser?.id === p.id ? 'white' : 'var(--text-main)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontSize: '0.875rem'
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{p.username}</div>
                  <div style={{ fontSize: '0.7rem', color: selectedUser?.id === p.id ? '#fecaca' : 'var(--text-muted)' }}>{p.regencyCity}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
            {selectedUser ? (
              <div>
                <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                  <h2 style={{ color: 'var(--primary)', marginBottom: '0.25rem' }}>{selectedUser.username}</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{selectedUser.regencyCity}, {selectedUser.province} · {selectedUser.gender || '–'}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
                  <div style={{ ...cardStyle, textAlign: 'left' }}>
                    <h3 style={{ color: 'var(--secondary)', marginBottom: '1rem', fontSize: '1rem' }}>Tahap 1: Catatan Belajar Mandiri</h3>
                    {(() => {
                      let notesArr = Array(6).fill('');
                      if (selectedUser.progress?.stage1Notes) {
                        try { const p = JSON.parse(selectedUser.progress.stage1Notes); if (Array.isArray(p)) notesArr = p; } catch {}
                      }
                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          {MATERIALS.map((m, i) => (
                            <div key={i} style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border)' }}>
                              <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginBottom: '0.25rem', fontWeight: 600 }}>{m}</div>
                              <div style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{notesArr[i] || <span style={{ color: 'var(--text-muted)' }}>–</span>}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  <div style={{ ...cardStyle, textAlign: 'left' }}>
                    <h3 style={{ color: 'var(--secondary)', marginBottom: '0.5rem', fontSize: '1rem' }}>Tahap 2: Catatan E-Modul</h3>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{selectedUser.progress?.stage2Notes || <span style={{ color: 'var(--text-muted)' }}>Belum dikirim</span>}</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={cardStyle}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Tahap 3 Pre-Test</div>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: selectedUser.progress?.stage3Score != null ? (selectedUser.progress.stage3Score >= 70 ? 'var(--success)' : 'var(--secondary)') : 'var(--text-muted)' }}>
                        {selectedUser.progress?.stage3Score ?? '–'}
                      </div>
                    </div>
                    <div style={cardStyle}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Tahap 6 Post-Test</div>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: selectedUser.progress?.stage6Score != null ? (selectedUser.progress.stage6Score >= 70 ? 'var(--success)' : 'var(--secondary)') : 'var(--text-muted)' }}>
                        {selectedUser.progress?.stage6Score ?? '–'}
                      </div>
                    </div>
                  </div>

                  <div style={{ ...cardStyle, textAlign: 'left' }}>
                    <h3 style={{ color: 'var(--secondary)', marginBottom: '1rem', fontSize: '1rem' }}>Tahap 5: Rencana Tindak Lanjut</h3>
                    {(() => {
                      let plan: any = {};
                      if (selectedUser.progress?.stage5Plan) {
                        try { plan = JSON.parse(selectedUser.progress.stage5Plan); } catch {}
                      }
                      const fields = [
                        { label: 'Nama Program', val: plan.programName },
                        { label: 'Waktu & Tanggal', val: plan.timeAndDate },
                        { label: 'Metode Program', val: plan.programMethod },
                        { label: 'Langkah-Langkah', val: plan.step },
                      ];
                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          {fields.map((f, i) => (
                            <div key={i} style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border)' }}>
                              <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginBottom: '0.25rem', fontWeight: 600 }}>{f.label}</div>
                              <div style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{f.val || <span style={{ color: 'var(--text-muted)' }}>–</span>}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  <div style={{ ...cardStyle, textAlign: 'left' }}>
                    <h3 style={{ color: 'var(--secondary)', marginBottom: '0.5rem', fontSize: '1rem' }}>Tahap 7: Data Sertifikat</h3>
                    {selectedUser.certificate ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                        <div><div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>Nama Lengkap</div><div>{selectedUser.certificate.fullName}</div></div>
                        <div><div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>Tanggal</div><div>{selectedUser.certificate.implementationDate}</div></div>
                        <div><div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>Kota</div><div>{selectedUser.certificate.regencyCity}</div></div>
                      </div>
                    ) : <span style={{ color: 'var(--text-muted)' }}>Belum dikirim</span>}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Pilih peserta dari panel kiri untuk melihat jawaban detail mereka.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
