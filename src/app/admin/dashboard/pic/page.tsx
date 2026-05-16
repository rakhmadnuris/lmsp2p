'use client';
import { useState, useEffect } from 'react';
import regionsData from '@/lib/regions.json';

const PROVINCES = Object.keys(regionsData);

type PicUser = {
  id: string;
  username: string;
  role: 'PIC_PROVINSI' | 'PIC_KABKOTA';
  province: string;
  regencyCity: string | null;
  createdAt: string;
};

export default function AdminPicPage() {
  const [pics, setPics] = useState<PicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [formRole, setFormRole] = useState<'PIC_PROVINSI' | 'PIC_KABKOTA'>('PIC_PROVINSI');
  const [formProvince, setFormProvince] = useState('');
  const [formRegency, setFormRegency] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [filterProvince, setFilterProvince] = useState('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  const fetchPics = async () => {
    const res = await fetch('/api/admin/pic');
    const data = await res.json();
    if (Array.isArray(data)) setPics(data);
    setLoading(false);
  };

  useEffect(() => { fetchPics(); }, []);

  const handleProvinceChange = (prov: string) => {
    setFormProvince(prov);
    setFormRegency('');
    setAvailableCities(prov ? (regionsData as any)[prov] || [] : []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsername || !formPassword || !formProvince) return alert('Semua field wajib diisi.');
    if (formRole === 'PIC_KABKOTA' && !formRegency) return alert('Pilih Kabupaten/Kota untuk PIC Kabkota.');
    setSaving(true);
    const res = await fetch('/api/admin/pic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: formUsername,
        password: formPassword,
        role: formRole,
        province: formProvince,
        regencyCity: formRole === 'PIC_KABKOTA' ? formRegency : undefined,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      alert(`Akun PIC berhasil dibuat! Username: ${formUsername}`);
      setFormUsername(''); setFormPassword(''); setFormProvince(''); setFormRegency('');
      fetchPics();
    } else {
      alert(data.error || 'Gagal membuat akun PIC.');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`Hapus akun PIC "${username}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    const res = await fetch(`/api/admin/pic?id=${id}`, { method: 'DELETE' });
    if (res.ok) { alert('Akun PIC berhasil dihapus.'); fetchPics(); }
    else alert('Gagal menghapus akun PIC.');
  };

  const filteredPics = filterProvince ? pics.filter(p => p.province === filterProvince) : pics;
  const provPics = filteredPics.filter(p => p.role === 'PIC_PROVINSI');
  const kabkotaPics = filteredPics.filter(p => p.role === 'PIC_KABKOTA');

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '2rem' }}>👥 Kelola Akun PIC</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Form Tambah PIC */}
        <div className="glass-panel">
          <h3 style={{ color: 'var(--secondary)', marginBottom: '1.25rem' }}>➕ Tambah Akun PIC</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label className="input-label">Role</label>
              <select className="input-field" value={formRole} onChange={e => setFormRole(e.target.value as any)} style={{ appearance: 'auto' }}>
                <option value="PIC_PROVINSI">PIC Provinsi</option>
                <option value="PIC_KABKOTA">PIC Kabupaten/Kota</option>
              </select>
            </div>
            <div>
              <label className="input-label">Provinsi</label>
              <select className="input-field" value={formProvince} onChange={e => handleProvinceChange(e.target.value)} style={{ appearance: 'auto' }} required>
                <option value="">-- Pilih Provinsi --</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            {formRole === 'PIC_KABKOTA' && (
              <div>
                <label className="input-label">Kabupaten/Kota</label>
                <select className="input-field" value={formRegency} onChange={e => setFormRegency(e.target.value)} style={{ appearance: 'auto' }} required disabled={!formProvince}>
                  <option value="">-- Pilih Kabupaten/Kota --</option>
                  {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="input-label">Username</label>
              <input type="text" className="input-field" value={formUsername} onChange={e => setFormUsername(e.target.value)} placeholder="Masukkan username PIC" required />
            </div>
            <div>
              <label className="input-label">Password</label>
              <input type="password" className="input-field" value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder="Minimal 8 karakter" required />
            </div>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              {saving ? 'Menyimpan...' : 'Buat Akun PIC'}
            </button>
          </form>
        </div>

        {/* Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-panel">
            <h4 style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>📌 Panduan</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: 0 }}>
              {[
                'PIC Provinsi: Admin RI menambahkan, 1 per provinsi.',
                'PIC Kab/Kota: bisa ditambah oleh Admin RI atau PIC Provinsi.',
                'Semua PIC login melalui Portal Admin & PIC.',
                'PIC Provinsi bisa kelola jadwal diskusi & tambah PIC Kab/Kota.',
                'PIC Kab/Kota bisa tambah peserta & buka akses tahap.',
              ].map((info, i) => (
                <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-muted)', paddingLeft: '1.25rem', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, color: 'var(--secondary)' }}>›</span>
                  {info}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="glass-panel" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#06b6d4' }}>{provPics.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PIC Provinsi</div>
            </div>
            <div className="glass-panel" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#a78bfa' }}>{kabkotaPics.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PIC Kab/Kota</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Tabel PIC */}
      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ color: 'var(--text-main)' }}>Daftar Akun PIC</h3>
          <select className="input-field" value={filterProvince} onChange={e => setFilterProvince(e.target.value)} style={{ appearance: 'auto', width: 'auto', minWidth: '220px' }}>
            <option value="">Semua Provinsi</option>
            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {loading ? <p style={{ color: 'var(--text-muted)' }}>Memuat data...</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>No</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Username</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Role</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Provinsi</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Kabupaten/Kota</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Dibuat</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredPics.map((pic, i) => (
                  <tr key={pic.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-main)', fontWeight: 600 }}>{pic.username}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600,
                        background: pic.role === 'PIC_PROVINSI' ? 'rgba(6,182,212,0.15)' : 'rgba(167,139,250,0.15)',
                        color: pic.role === 'PIC_PROVINSI' ? '#06b6d4' : '#a78bfa',
                        border: `1px solid ${pic.role === 'PIC_PROVINSI' ? 'rgba(6,182,212,0.3)' : 'rgba(167,139,250,0.3)'}`,
                      }}>
                        {pic.role === 'PIC_PROVINSI' ? 'PIC Provinsi' : 'PIC Kab/Kota'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{pic.province}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{pic.regencyCity || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {new Date(pic.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDelete(pic.id, pic.username)}
                        style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', background: 'rgba(255,43,43,0.1)', border: '1px solid var(--error)', color: 'var(--error)', borderRadius: '0.5rem', cursor: 'pointer' }}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredPics.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada akun PIC.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
