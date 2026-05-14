'use client';
import React, { useState } from 'react';
import regionsData from '@/lib/regions.json';

const PROVINCES = Object.keys(regionsData);

export default function RegisterParticipantPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [province, setProvince] = useState('');
  const [regencyCity, setRegencyCity] = useState('');
  const [gender, setGender] = useState('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setProvince(selected);
    const cities = (regionsData as any)[selected] || [];
    setAvailableCities(cities);
    setRegencyCity('');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!province || !regencyCity || !gender) {
      alert('Harap lengkapi semua kolom termasuk Provinsi, Kabupaten/Kota, dan Jenis Kelamin.');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/admin/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, province, regencyCity, gender })
      });
      if (res.ok) {
        alert('Peserta berhasil didaftarkan');
        setUsername(''); setPassword('');
        setProvince(''); setRegencyCity(''); setGender('');
        setAvailableCities([]);
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Gagal mendaftarkan peserta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem', color: 'var(--primary)' }}>Daftarkan Peserta</h1>
      
      <div className="glass-panel" style={{ maxWidth: '600px' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Buat Akun Baru</h2>
        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label className="input-label">Nama Pengguna</label>
            <input type="text" className="input-field" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          
          <div className="input-group">
            <label className="input-label">Kata Sandi</label>
            <input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          <div className="input-group" style={{ marginBottom: '1.5rem' }}>
            <label className="input-label">Jenis Kelamin</label>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="gender" value="Male" checked={gender === 'Male'} onChange={(e) => setGender(e.target.value)} required />
                Laki-laki
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="gender" value="Female" checked={gender === 'Female'} onChange={(e) => setGender(e.target.value)} required />
                Perempuan
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
            <div className="input-group">
              <label className="input-label">Provinsi</label>
              <select className="input-field" value={province} onChange={handleProvinceChange} required style={{ appearance: 'auto' }}>
                <option value="" disabled>Pilih Provinsi</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Kabupaten/Kota</label>
              <select className="input-field" value={regencyCity} onChange={e => setRegencyCity(e.target.value)} required disabled={!province} style={{ appearance: 'auto' }}>
                <option value="" disabled>Pilih Kabupaten/Kota</option>
                {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--secondary)', width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Mendaftarkan...' : 'Daftarkan Pengguna'}
          </button>
        </form>
      </div>
    </div>
  );
}
