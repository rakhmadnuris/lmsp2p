'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Stage4() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [discussionDate, setDiscussionDate] = useState<string | null>(null);
  const [discussionMode, setDiscussionMode] = useState<string | null>(null);
  const [discussionZoom, setDiscussionZoom] = useState<string | null>(null);
  const [discussionLocation, setDiscussionLocation] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/participant/progress').then(res => res.json()),
      fetch('/api/participant/discussion').then(res => res.json())
    ]).then(([progressData, discussionData]) => {
      if (progressData.currentStage > 4) {
        setIsLocked(true);
      }
      if (discussionData.date) {
        setDiscussionDate(discussionData.date);
        setDiscussionMode(discussionData.mode);
        setDiscussionZoom(discussionData.zoomLink);
        setDiscussionLocation(discussionData.location);
      }
    }).finally(() => setInitialLoad(false));
  }, []);

  const handleNext = async () => {
    if (isLocked) return;
    setSaving(true);
    try {
      const res = await fetch('/api/participant/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 4, data: {} })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.isNextStageLocked) {
          alert('Tahap 5 Rencana Tindak Lanjut belum dibuka. Tunggu admin membuka tahap ini.');
          router.push('/dashboard');
        } else {
          router.push('/stages/5');
        }
      }
    } catch (err) {
      alert('Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  };

  if (initialLoad) return <div style={{ padding: '2rem' }}>Memuat materi...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Tahap 4: Diskusi &amp; Pendalaman</h1>
        {isLocked && <span style={{ padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary)', borderRadius: '0.5rem', fontWeight: 600 }}>Selesai</span>}
      </div>
      
      <div className="glass-panel" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--primary)' }}>
        <h2 style={{ marginBottom: '1rem' }}>Detail Pertemuan</h2>
        
        <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.875rem' }}>Format</strong>
            <span style={{ textTransform: 'capitalize' }}>
              {discussionMode ? (discussionMode === 'daring' ? '🌐 Daring (Online)' : '📍 Luring (Offline)') : 'Belum ditentukan'}
            </span>
          </div>
          <div>
            <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.875rem' }}>Tanggal &amp; Waktu</strong>
            <span>{discussionDate ? new Date(discussionDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Belum diatur. Menunggu jadwal dari PIC Kab/Kota.'}</span>
          </div>
          
          {discussionMode === 'daring' && discussionZoom && (
            <div>
              <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.875rem' }}>Tautan Meeting (Zoom)</strong>
              <a href={discussionZoom} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>{discussionZoom}</a>
            </div>
          )}

          {discussionMode === 'luring' && discussionLocation && (
            <div>
              <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.875rem' }}>Lokasi Pelaksanaan</strong>
              <span>{discussionLocation}</span>
            </div>
          )}
        </div>
        
        {!isLocked && (
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', borderRadius: '0.5rem' }}>
            <p style={{ color: '#fca5a5', fontSize: '0.875rem' }}><strong>Penting:</strong> Kehadiran wajib untuk melanjutkan ke tahap Rencana Tindak Lanjut.</p>
          </div>
        )}
      </div>

      {!isLocked && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleNext} className="btn btn-primary" disabled={saving}>
            {saving ? 'Memproses...' : 'Tandai Hadir & Lanjutkan'}
          </button>
        </div>
      )}
    </div>
  );
}
