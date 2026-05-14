'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Stage7() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [implementationDate, setImplementationDate] = useState('');
  const [regencyCity, setRegencyCity] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch('/api/participant/progress')
      .then(res => res.json())
      .then(data => {
        if (data.hasCertificate) {
          setIsLocked(true);
        }
      })
      .finally(() => {
        const draft = localStorage.getItem('stage7Answers');
        if (draft) {
          try {
            const parsed = JSON.parse(draft);
            if (parsed.fullName) setFullName(parsed.fullName);
            if (parsed.implementationDate) setImplementationDate(parsed.implementationDate);
            if (parsed.regencyCity) setRegencyCity(parsed.regencyCity);
          } catch (e) {}
        }
        setInitialLoad(false);
      });
  }, []);

  useEffect(() => {
    if (initialLoad || submitted || isLocked) return;
    localStorage.setItem('stage7Answers', JSON.stringify({ fullName, implementationDate, regencyCity }));
  }, [fullName, implementationDate, regencyCity, initialLoad, submitted, isLocked]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    setSaving(true);
    try {
      const res = await fetch('/api/participant/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, implementationDate, regencyCity })
      });
      if (res.ok) {
        setSubmitted(true);
        localStorage.removeItem('stage7Answers');
      } else {
        const data = await res.json();
        if (data.error === 'Certificate already generated') {
          setSubmitted(true);
          localStorage.removeItem('stage7Answers');
        } else {
          alert(data.error || 'Gagal mengirim data sertifikat.');
        }
      }
    } catch (err) {
      alert('Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadCertificate = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/participant/certificate/download');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Gagal mengunduh sertifikat.');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Sertifikat_P2P.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Terjadi kesalahan saat mengunduh sertifikat.');
    } finally {
      setDownloading(false);
    }
  };

  if (initialLoad) return <div style={{ padding: '2rem' }}>Memuat...</div>;

  if (submitted || isLocked) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="glass-panel" style={{ textAlign: 'center', maxWidth: '500px' }}>
          <div style={{ width: '80px', height: '80px', margin: '0 auto 2rem', background: 'var(--secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h2 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Selamat!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Anda telah berhasil menyelesaikan semua 7 tahap. Sertifikat Anda siap diunduh.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleDownloadCertificate} className="btn" disabled={downloading} style={{ padding: '0.75rem 1.5rem', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid var(--secondary)', color: 'var(--secondary)', fontWeight: 600 }}>
              {downloading ? '⏳ Membuat...' : '📥 Unduh Sertifikat (.jpg)'}
            </button>
            <button onClick={() => router.push('/dashboard')} className="btn btn-primary">Kembali ke Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Tahap 7: Data Sertifikat</h1>
      </div>
      
      <div className="glass-panel">
        <h2 style={{ marginBottom: '1rem' }}>Langkah Terakhir</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Isi formulir berikut dengan benar. Data ini akan digunakan untuk membuat sertifikat resmi Anda.
          <strong> Catatan: Formulir ini hanya dapat dikirim satu kali.</strong>
        </p>
        
        <p style={{ fontSize: '0.875rem', color: 'var(--primary)', marginBottom: '2rem' }}>
          Jawaban draf Anda disimpan otomatis.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Nama Lengkap (beserta gelar)</label>
            <input 
              type="text" 
              className="input-field" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="cth., Budi Santoso, S.Pd., M.Si."
              required 
            />
          </div>
          
          {/* Hanya tanggal, tanpa waktu */}
          <div className="input-group">
            <label className="input-label">Tanggal Implementasi</label>
            <input 
              type="date" 
              className="input-field" 
              value={implementationDate}
              onChange={(e) => setImplementationDate(e.target.value)}
              required 
            />
          </div>
          
          <div className="input-group">
            <label className="input-label">Kabupaten/Kota</label>
            <input 
              type="text" 
              className="input-field" 
              value={regencyCity}
              onChange={(e) => setRegencyCity(e.target.value)}
              required 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving || !fullName || !implementationDate || !regencyCity}>
              {saving ? 'Mengirim...' : 'Kirim & Selesaikan Program'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
