'use client';
import { useState } from 'react';

export default function ProgressHeader({ currentStage, hasCertificate }: { currentStage: number, hasCertificate: boolean }) {
  const [downloading, setDownloading] = useState(false);

  const stageProgress = Math.min(currentStage - 1, 7);
  const percentage = Math.round((stageProgress / 7) * 100);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/participant/certificate/download');
      if (!res.ok) { alert('Gagal mengunduh sertifikat.'); return; }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Sertifikat_P2P.jpg';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Terjadi kesalahan saat mengunduh sertifikat.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' }}>Kemajuan Anda</h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{stageProgress} dari 7 tahap diselesaikan</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {hasCertificate && (
            <button onClick={handleDownload} className="btn" disabled={downloading} style={{
              padding: '0.5rem 1rem', fontSize: '0.8rem',
              background: 'rgba(212,162,76,0.12)', border: '1px solid rgba(212,162,76,0.3)',
              color: 'var(--gold-light)', fontWeight: 600, borderRadius: '0.75rem',
            }}>
              {downloading ? '⏳ Mengunduh...' : '📥 Unduh Sertifikat'}
            </button>
          )}
          <span style={{
            fontSize: '1.1rem', fontWeight: 800,
            background: 'linear-gradient(135deg, var(--secondary), var(--gold-light))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>{percentage}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
          borderRadius: '3px',
          transition: 'width 0.6s ease',
          boxShadow: `0 0 8px rgba(212,162,76,0.4)`,
        }} />
      </div>
    </div>
  );
}
