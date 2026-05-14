'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Stage2() {
  const router = useRouter();
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  
  const lastSavedNotesRef = useRef<string>('');

  useEffect(() => {
    fetch('/api/participant/progress')
      .then(res => res.json())
      .then(data => {
        if (data.progress?.stage2Notes) {
          setNotes(data.progress.stage2Notes);
          lastSavedNotesRef.current = data.progress.stage2Notes;
        }
        if (data.currentStage > 2) {
          setIsLocked(true);
        }
      })
      .finally(() => setInitialLoad(false));
  }, []);

  useEffect(() => {
    if (initialLoad || isLocked) return;
    if (notes === lastSavedNotesRef.current) return;

    const timer = setTimeout(() => {
      fetch('/api/participant/auto-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 2, data: { notes } })
      }).then(() => {
        lastSavedNotesRef.current = notes;
      }).catch(err => console.error("Auto-save failed", err));
    }, 1000);

    return () => clearTimeout(timer);
  }, [notes, initialLoad, isLocked]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    setSaving(true);
    try {
      const res = await fetch('/api/participant/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 2, data: { notes } })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.isNextStageLocked) {
          alert('Tahap 3 Pre-Test belum dibuka. Tunggu admin membuka tahap ini.');
          router.push('/dashboard');
        } else {
          alert('Catatan tersimpan! Lanjut ke Tahap 3.');
          router.push('/stages/3');
        }
      } else {
        alert('Gagal menyimpan kemajuan.');
      }
    } catch (err) {
      alert('Error occurred.');
    } finally {
      setSaving(false);
    }
  };

  if (initialLoad) return <div style={{ padding: '2rem' }}>Memuat materi...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Tahap 2: E-Modul</h1>
        {isLocked && <span style={{ padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary)', borderRadius: '0.5rem', fontWeight: 600 }}>Selesai</span>}
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 1rem' }}>
          <h2 style={{ fontSize: '1.25rem' }}>Module P2P SRIKANDI</h2>
          <a href="/materials/module.pdf" download className="btn btn-primary" style={{ background: 'var(--secondary)', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            Unduh PDF
          </a>
        </div>
        
        {/* PDF Embedded Preview */}
        <div style={{ width: '100%', height: '600px', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <iframe src="/materials/module.pdf" width="100%" height="100%" style={{ border: 'none' }} title="E-Module Preview" />
        </div>
      </div>

      <div className="glass-panel">
        <h3 style={{ marginBottom: '1rem' }}>Catatan Kritis Modul</h3>
        {!isLocked && (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Catatan Anda disimpan otomatis saat Anda mengetik.
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <textarea 
            className="input-field" 
            rows={5} 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tulis refleksi Anda tentang materi bacaan..."
            required
            disabled={isLocked}
            style={{ resize: 'vertical', marginBottom: '1rem', opacity: isLocked ? 0.7 : 1 }}
          />
          {!isLocked && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={!notes.trim() || saving}>
                {saving ? 'Menyimpan...' : 'Selesai & Lanjutkan'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
