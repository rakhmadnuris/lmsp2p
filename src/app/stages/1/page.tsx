'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const MATERIALS = [
  { title: 'Materi 1: Teknis Pencegahan Pelanggaran', videoId: 'PgO2qxf9k40' },
  { title: 'Materi 2: Teknis Pelaporan Dugaan Pelanggaran', videoId: 'FCmk-Ms2_yQ' },
  { title: 'Materi 3: Teknis Penyelesaian Sengketa Proses', videoId: 'PyhCX3O7__c' },
  { title: 'Materi 4: Teknis Pengembangan Gerakan Pengawasan Partisipatif', videoId: 'r-4Q6CeSY7g' },
  { title: 'Materi 5: Teknis Penguatan Jaringan dan Pemberdayaan Komunitas', videoId: 'n0oi4blLXDo' },
  { title: 'Materi 6: Teknis Pengawasan Berbasis Digital', videoId: 'wFWgdDEtFy4' },
];

export default function Stage1() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [notes, setNotes] = useState<string[]>(Array(6).fill(''));
  const [saving, setSaving] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  
  const lastSavedNotesRef = useRef<string>('');

  useEffect(() => {
    fetch('/api/participant/progress')
      .then(res => res.json())
      .then(data => {
        if (data.progress?.stage1Notes) {
          try {
            const parsed = JSON.parse(data.progress.stage1Notes);
            if (Array.isArray(parsed)) {
              setNotes(parsed);
              lastSavedNotesRef.current = JSON.stringify(parsed);
            }
          } catch (e) {
            const newNotes = Array(6).fill('');
            newNotes[0] = data.progress.stage1Notes;
            setNotes(newNotes);
            lastSavedNotesRef.current = JSON.stringify(newNotes);
          }
        }
        if (data.currentStage > 1) {
          setIsLocked(true);
        }
      })
      .finally(() => setInitialLoad(false));
  }, []);

  useEffect(() => {
    if (initialLoad || isLocked) return;
    const currentNotesStr = JSON.stringify(notes);
    if (currentNotesStr === lastSavedNotesRef.current) return;
    const timer = setTimeout(() => {
      fetch('/api/participant/auto-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 1, data: { notesArray: notes } })
      }).then(() => {
        lastSavedNotesRef.current = currentNotesStr;
      }).catch(err => console.error("Auto-save gagal", err));
    }, 1000);
    return () => clearTimeout(timer);
  }, [notes, initialLoad, isLocked]);

  const handleNoteChange = (val: string) => {
    const newNotes = [...notes];
    newNotes[currentIndex] = val;
    setNotes(newNotes);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) { router.push('/stages/2'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/participant/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 1, data: { notes: JSON.stringify(notes) } })
      });
      if (res.ok) {
        alert('Semua materi selesai! Lanjut ke Tahap 2.');
        router.push('/stages/2');
      } else {
        alert('Gagal menyimpan kemajuan.');
      }
    } catch (err) {
      alert('Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  };

  if (initialLoad) return <div style={{ padding: '2rem' }}>Memuat materi...</div>;

  const currentMaterial = MATERIALS[currentIndex];
  const allCompleted = notes.every(n => n.trim().length > 0);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Tahap 1: Belajar Mandiri</h1>
        {isLocked && <span style={{ padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary)', borderRadius: '0.5rem', fontWeight: 600 }}>Selesai</span>}
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Materi {currentIndex + 1} dari {MATERIALS.length}
        </div>
      </div>

      <div style={{ width: '100%', height: '8px', background: 'var(--surface)', borderRadius: '4px', marginBottom: '2rem', overflow: 'hidden' }}>
        <div style={{ width: `${((currentIndex + 1) / MATERIALS.length) * 100}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s ease' }} />
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>{currentMaterial.title}</h2>
        <div style={{ width: '100%', height: '400px', background: 'rgba(0,0,0,0.5)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <iframe 
            width="100%" height="100%" 
            src={`https://www.youtube.com/embed/${currentMaterial.videoId}`} 
            title={currentMaterial.title} 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          ></iframe>
        </div>
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Catatan Kritis</h3>
        {!isLocked && (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Catatan Anda disimpan otomatis saat Anda mengetik.
          </p>
        )}
        <textarea 
          className="input-field" 
          rows={5} 
          value={notes[currentIndex]}
          onChange={(e) => handleNoteChange(e.target.value)}
          placeholder={`Tulis catatan kritis Anda untuk ${currentMaterial.title}...`}
          disabled={isLocked}
          style={{ resize: 'vertical', opacity: isLocked ? 0.7 : 1 }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '2rem', marginTop: '2rem' }}>
        <button 
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} 
          className="btn" 
          disabled={currentIndex === 0}
          style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid var(--border)', opacity: currentIndex === 0 ? 0.5 : 1, color: 'var(--text-main)' }}
        >
          ← Materi Sebelumnya
        </button>

        {currentIndex < MATERIALS.length - 1 ? (
          <button 
            onClick={() => setCurrentIndex(prev => Math.min(MATERIALS.length - 1, prev + 1))} 
            className="btn btn-primary"
            style={{ padding: '0.75rem 1.5rem' }}
          >
            Materi Berikutnya →
          </button>
        ) : (
          <button 
            onClick={handleFinalSubmit} 
            className="btn btn-primary"
            disabled={(!allCompleted && !isLocked) || saving}
            style={{ padding: '0.75rem 1.5rem', background: (allCompleted || isLocked) ? 'var(--secondary)' : 'var(--border)' }}
          >
            {isLocked ? 'Lanjut ke Tahap 2 →' : (saving ? 'Menyimpan...' : 'Selesai & Lanjutkan')}
          </button>
        )}
      </div>
      
      {!allCompleted && !isLocked && currentIndex === MATERIALS.length - 1 && (
        <p style={{ color: 'var(--error)', textAlign: 'right', marginTop: '1rem', fontSize: '0.875rem' }}>
          * Anda harus mengisi catatan kritis untuk semua 6 materi sebelum melanjutkan.
        </p>
      )}
    </div>
  );
}
