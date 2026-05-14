'use client';
import React, { useState, useEffect } from 'react';
import regionsData from '@/lib/regions.json';

const PROVINCES = Object.keys(regionsData);

export default function ParticipantProgressPage() {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Region Access Control state
  const [selectedProvince, setSelectedProvince] = useState(PROVINCES[0]);
  const [selectedCity, setSelectedCity] = useState('');
  const [availableCities, setAvailableCities] = useState<string[]>((regionsData as any)[PROVINCES[0]] || []);

  // Participant Progress filter state
  const [filterProvince, setFilterProvince] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterCities, setFilterCities] = useState<string[]>([]);

  const handleRegionProvinceChange = (prov: string) => {
    setSelectedProvince(prov);
    setSelectedCity('');
    setAvailableCities((regionsData as any)[prov] || []);
  };

  const handleFilterProvinceChange = (prov: string) => {
    setFilterProvince(prov);
    setFilterCity('');
    setFilterCities(prov ? ((regionsData as any)[prov] || []) : []);
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

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

  const handleDeleteParticipant = async (userId: string, username: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus peserta "${username}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/participants/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Peserta berhasil dihapus.');
        fetchParticipants();
      } else {
        alert('Gagal menghapus peserta.');
      }
    } catch (error) {
      alert('Terjadi kesalahan saat menghapus peserta.');
    }
  };

  const handleResetParticipant = async (userId: string, username: string) => {
    if (!confirm(`Apakah Anda yakin ingin mereset semua kemajuan dan jawaban untuk "${username}"? Peserta harus memulai ulang dari Tahap 1.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/participants/${userId}/reset`, { method: 'POST' });
      if (res.ok) {
        alert('Kemajuan peserta berhasil direset.');
        fetchParticipants();
      } else {
        alert('Gagal mereset kemajuan peserta.');
      }
    } catch (error) {
      alert('Terjadi kesalahan saat mereset.');
    }
  };

  const toggleRegionAccess = async (stage: number, value: boolean) => {
    try {
      await fetch('/api/admin/regions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ province: selectedProvince, regencyCity: selectedCity || undefined, stage, value })
      });
      fetchParticipants();
    } catch (error) {
      alert('Gagal memperbarui akses wilayah');
    }
  };

  // Filtered participants
  const filteredParticipants = participants.filter((p: any) => {
    if (filterProvince && p.province !== filterProvince) return false;
    if (filterCity && p.regencyCity !== filterCity) return false;
    return true;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem', color: 'var(--primary)' }}>Kemajuan Peserta & Kontrol Akses</h1>
      
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Kontrol Akses Wilayah</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Kelola akses Tahap 3, 5, dan 6 berdasarkan Provinsi dan Kabupaten/Kota.</p>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="input-label">Pilih Provinsi</label>
            <select className="input-field" value={selectedProvince} onChange={e => handleRegionProvinceChange(e.target.value)} style={{ appearance: 'auto' }}>
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="input-label">Pilih Kabupaten/Kota</label>
            <select className="input-field" value={selectedCity} onChange={e => setSelectedCity(e.target.value)} style={{ appearance: 'auto' }}>
              <option value="">Semua Kota (Se-Provinsi)</option>
              {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'var(--surface)' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>{selectedProvince}{selectedCity ? ` — ${selectedCity}` : ''}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <strong style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Tahap 3 (Pre-Test)</strong>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => toggleRegionAccess(3, true)} className="btn" style={{ padding: '0.5rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--success)', color: 'var(--success)', flex: 1 }}>Buka</button>
                <button onClick={() => toggleRegionAccess(3, false)} className="btn" style={{ padding: '0.5rem', background: 'rgba(255, 43, 43, 0.1)', border: '1px solid var(--error)', color: 'var(--error)', flex: 1 }}>Kunci</button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <strong style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Tahap 5 (RTL)</strong>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => toggleRegionAccess(5, true)} className="btn" style={{ padding: '0.5rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--success)', color: 'var(--success)', flex: 1 }}>Buka</button>
                <button onClick={() => toggleRegionAccess(5, false)} className="btn" style={{ padding: '0.5rem', background: 'rgba(255, 43, 43, 0.1)', border: '1px solid var(--error)', color: 'var(--error)', flex: 1 }}>Kunci</button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <strong style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Tahap 6 (Post-Test)</strong>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => toggleRegionAccess(6, true)} className="btn" style={{ padding: '0.5rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--success)', color: 'var(--success)', flex: 1 }}>Buka</button>
                <button onClick={() => toggleRegionAccess(6, false)} className="btn" style={{ padding: '0.5rem', background: 'rgba(255, 43, 43, 0.1)', border: '1px solid var(--error)', color: 'var(--error)', flex: 1 }}>Kunci</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel">
        <h2 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Kemajuan Peserta</h2>
        
        {/* Province/City filter for participant list */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="input-label">Filter Provinsi</label>
            <select className="input-field" value={filterProvince} onChange={e => handleFilterProvinceChange(e.target.value)} style={{ appearance: 'auto' }}>
              <option value="">Semua Provinsi</option>
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="input-label">Filter Kabupaten/Kota</label>
            <select className="input-field" value={filterCity} onChange={e => setFilterCity(e.target.value)} style={{ appearance: 'auto' }} disabled={!filterProvince}>
              <option value="">Semua Kabupaten/Kota</option>
              {filterCities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {loading ? <p>Memuat data peserta...</p> : (
          <>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Menampilkan {filteredParticipants.length} dari {participants.length} peserta
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--surface)' }}>
                    <th style={{ padding: '1rem', fontWeight: 700 }}>Nama Pengguna</th>
                    <th style={{ padding: '1rem', fontWeight: 700 }}>Wilayah</th>
                    <th style={{ padding: '1rem', fontWeight: 700 }}>Tahap Saat Ini</th>
                    <th style={{ padding: '1rem', fontWeight: 700 }}>Status Akses</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 700 }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants.map((p: any) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem', fontWeight: 500 }}>{p.username}</td>
                      <td style={{ padding: '1rem' }}>{p.regencyCity}, {p.province}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ padding: '0.25rem 0.75rem', background: 'var(--primary)', color: 'white', borderRadius: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>Tahap {p.currentStage}</span>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        T3: {p.stage3Unlocked ? '✅' : '🔒'} | T5: {p.stage5Unlocked ? '✅' : '🔒'} | T6: {p.stage6Unlocked ? '✅' : '🔒'}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button onClick={() => handleResetParticipant(p.id, p.username)} className="btn" style={{ padding: '0.25rem 0.75rem', background: 'rgba(212, 162, 76, 0.15)', border: '1px solid var(--secondary)', color: 'var(--secondary)', fontSize: '0.875rem', marginRight: '0.5rem', fontWeight: 600 }}>
                          Reset
                        </button>
                        <button onClick={() => handleDeleteParticipant(p.id, p.username)} className="btn" style={{ padding: '0.25rem 0.75rem', background: 'rgba(255, 43, 43, 0.1)', border: '1px solid var(--error)', color: 'var(--error)', fontSize: '0.875rem', fontWeight: 600 }}>
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
