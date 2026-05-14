'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Stage5() {
  const router = useRouter();
  const [plan, setPlan] = useState({
    programName: '',
    timeAndDate: '',
    programMethod: '',
    step: ''
  });
  const [saving, setSaving] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  
  const lastSavedPlanRef = useRef<string>('');

  useEffect(() => {
    fetch('/api/participant/progress')
      .then(res => res.json())
      .then(data => {
        if (data.progress?.stage5Plan) {
          try {
            const parsed = JSON.parse(data.progress.stage5Plan);
            if (typeof parsed === 'object' && parsed !== null) {
              setPlan(parsed);
              lastSavedPlanRef.current = JSON.stringify(parsed);
            }
          } catch (e) {
            setPlan(prev => ({ ...prev, programName: data.progress.stage5Plan }));
            lastSavedPlanRef.current = JSON.stringify({ programName: data.progress.stage5Plan, timeAndDate: '', programMethod: '', step: '' });
          }
        }
        if (data.currentStage > 5) {
          setIsLocked(true);
        }
      })
      .finally(() => setInitialLoad(false));
  }, []);

  useEffect(() => {
    if (initialLoad || isLocked) return;
    const currentPlanStr = JSON.stringify(plan);
    if (currentPlanStr === lastSavedPlanRef.current) return;
    const timer = setTimeout(() => {
      fetch('/api/participant/auto-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 5, data: { plan } })
      }).then(() => {
        lastSavedPlanRef.current = currentPlanStr;
      }).catch(err => console.error("Auto-save gagal", err));
    }, 1000);
    return () => clearTimeout(timer);
  }, [plan, initialLoad, isLocked]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    setSaving(true);
    try {
      const res = await fetch('/api/participant/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 5, data: { plan: JSON.stringify(plan) } })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.isNextStageLocked) {
          alert('Rencana Tindak Lanjut tersimpan! Tahap 6 Post-Test belum dibuka. Tunggu admin membuka tahap ini.');
          router.push('/dashboard');
        } else {
          alert('Rencana Tindak Lanjut berhasil dikirim!');
          router.push('/stages/6');
        }
      } else {
        alert('Gagal menyimpan kemajuan.');
      }
    } catch (err) {
      alert('Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = plan.programName.trim() && plan.timeAndDate.trim() && plan.programMethod.trim() && plan.step.trim();

  if (initialLoad) return <div style={{ padding: '2rem' }}>Memuat materi...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Tahap 5: Rencana Tindak Lanjut (RTL)</h1>
        {isLocked && <span style={{ padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary)', borderRadius: '0.5rem', fontWeight: 600 }}>Selesai</span>}
      </div>
      
      <div className="glass-panel">
        <h2 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Pengiriman Rencana</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Berdasarkan tahap pembelajaran sebelumnya dan diskusi, uraikan rencana tindak lanjut Anda untuk pengawasan partisipatif di wilayah Anda.
        </p>
        
        {!isLocked && (
          <p style={{ fontSize: '0.875rem', color: 'var(--primary)', marginBottom: '2rem' }}>
            Jawaban Anda disimpan otomatis saat Anda mengetik.
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="input-group">
            <label className="input-label">Nama Program</label>
            <input 
              className="input-field" 
              value={plan.programName}
              onChange={(e) => setPlan({...plan, programName: e.target.value})}
              placeholder="cth., Sosialisasi Pengawasan Pemilu"
              required
              disabled={isLocked}
              style={{ opacity: isLocked ? 0.7 : 1 }}
            />
          </div>
          
          <div className="input-group">
            <label className="input-label">Waktu &amp; Tanggal Program</label>
            <input 
              type="datetime-local"
              className="input-field" 
              value={plan.timeAndDate}
              onChange={(e) => setPlan({...plan, timeAndDate: e.target.value})}
              required
              disabled={isLocked}
              style={{ opacity: isLocked ? 0.7 : 1 }}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Metode Program</label>
            <input 
              className="input-field" 
              value={plan.programMethod}
              onChange={(e) => setPlan({...plan, programMethod: e.target.value})}
              placeholder="cth., Seminar Offline & Diskusi Panel"
              required
              disabled={isLocked}
              style={{ opacity: isLocked ? 0.7 : 1 }}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Langkah-Langkah</label>
            <textarea 
              className="input-field" 
              rows={4}
              value={plan.step}
              onChange={(e) => setPlan({...plan, step: e.target.value})}
              placeholder="Jelaskan langkah-langkah pelaksanaan program ini..."
              required
              disabled={isLocked}
              style={{ resize: 'vertical', opacity: isLocked ? 0.7 : 1 }}
            />
          </div>

          {!isLocked && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={!isFormValid || saving}>
                {saving ? 'Mengirim...' : 'Kirim Rencana & Lanjutkan'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
