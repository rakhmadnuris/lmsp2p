'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { questions } from '@/lib/questions';

const TIME_LIMIT_SECONDS = 15 * 60; // 15 minutes

export default function Stage6() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  
  // Timer states
  const [hasStarted, setHasStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  const answersRef = useRef(answers);
  
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    fetch('/api/participant/progress')
      .then(res => res.json())
      .then(data => {
        if (data.progress?.stage6Score !== null && data.progress?.stage6Score !== undefined) {
          setScore(data.progress.stage6Score);
        }
        if (data.currentStage > 6) {
          setIsLocked(true);
        }
      })
      .finally(() => {
        // Load draft answers
        const draft = localStorage.getItem('stage6Answers');
        if (draft) {
          try { setAnswers(JSON.parse(draft)); } catch (e) {}
        }
        
        // Load timer state
        const savedStartTime = localStorage.getItem('stage6StartTime');
        if (savedStartTime && !isLocked && score === null) {
          const startTime = parseInt(savedStartTime, 10);
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const remaining = TIME_LIMIT_SECONDS - elapsed;
          
          if (remaining <= 0) {
            setHasStarted(true);
            setTimeLeft(0);
            autoSubmit();
          } else {
            setHasStarted(true);
            setTimeLeft(remaining);
          }
        }
        
        setInitialLoad(false);
      });
  }, []);

  // Timer Interval
  useEffect(() => {
    if (!hasStarted || isLocked || score !== null || timeLeft === null || timeLeft <= 0) return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev && prev <= 1) {
          clearInterval(interval);
          autoSubmit();
          return 0;
        }
        return prev ? prev - 1 : 0;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [hasStarted, isLocked, score, timeLeft]);

  // Auto-save to localStorage
  useEffect(() => {
    if (initialLoad || isLocked) return;
    localStorage.setItem('stage6Answers', JSON.stringify(answers));
  }, [answers, initialLoad, isLocked]);

  const startTest = () => {
    const now = Date.now();
    localStorage.setItem('stage6StartTime', now.toString());
    setHasStarted(true);
    setTimeLeft(TIME_LIMIT_SECONDS);
  };

  const calculateScore = (currentAnswers: Record<number, number>) => {
    let correctCount = 0;
    questions.forEach(q => {
      if (currentAnswers[q.id] === q.correctOption) correctCount++;
    });
    return Math.round((correctCount / questions.length) * 100);
  };

  const autoSubmit = async () => {
    if (saving || isLocked) return;
    setSaving(true);
    const calculatedScore = calculateScore(answersRef.current);
    try {
      const res = await fetch('/api/participant/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 6, data: { score: calculatedScore } })
      });
      if (res.ok) {
        setScore(calculatedScore);
        localStorage.removeItem('stage6Answers');
        localStorage.removeItem('stage6StartTime');
        setTimeout(() => router.push('/stages/7'), 3000);
      }
    } catch (err) {
      alert('Waktu habis, namun pengiriman otomatis gagal. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || timeLeft === 0) return;
    
    if (Object.keys(answers).length < questions.length) {
      alert("Anda harus menjawab semua pertanyaan sebelum mengirim.");
      return;
    }
    
    setSaving(true);
    const calculatedScore = calculateScore(answers);

    try {
      const res = await fetch('/api/participant/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 6, data: { score: calculatedScore } })
      });
      if (res.ok) {
        setScore(calculatedScore);
        localStorage.removeItem('stage6Answers');
        localStorage.removeItem('stage6StartTime');
        setTimeout(() => router.push('/stages/7'), 3000);
      }
    } catch (err) {
      alert('Terjadi kesalahan saat mengirim.');
    } finally {
      setSaving(false);
    }
  };

  if (initialLoad) return <div style={{ padding: '2rem' }}>Memuat...</div>;

  if (score !== null && isLocked) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="glass-panel" style={{ textAlign: 'center' }}>
          <h1 style={{ color: 'var(--secondary)', marginBottom: '1rem', fontSize: '3rem' }}>{score}/100</h1>
          <h2>Post-Test Selesai!</h2>
          <div style={{ marginTop: '2rem' }}>
            <button onClick={() => router.push('/stages/7')} className="btn btn-primary">Lanjut ke Tahap 7 Sertifikat</button>
          </div>
        </div>
      </div>
    );
  }

  if (score !== null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="glass-panel" style={{ textAlign: 'center' }}>
          <h1 style={{ color: 'var(--secondary)', marginBottom: '1rem', fontSize: '3rem' }}>{score}/100</h1>
          <h2>Post-Test Selesai!</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '1rem', marginBottom: '2rem' }}>Mengalihkan ke Tahap 7...</p>
          <button onClick={() => router.push('/stages/7')} className="btn btn-primary">Ke Sertifikat Sekarang</button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', position: 'relative' }}>
      
      {!hasStarted && !isLocked ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div className="glass-panel" style={{ textAlign: 'center', maxWidth: '500px' }}>
            <h1 style={{ marginBottom: '1rem' }}>Tahap 6: Post-Test</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Anda memiliki <strong>15 menit</strong> untuk menyelesaikan {questions.length} pertanyaan.
            </p>
            <p style={{ color: 'var(--error)', marginBottom: '2rem', fontSize: '0.875rem' }}>
              Setelah dimulai, waktu tidak dapat dijeda. Jika waktu habis, jawaban Anda akan otomatis dikirim.
            </p>
            <button onClick={startTest} className="btn btn-primary" style={{ fontSize: '1.25rem', padding: '1rem 2rem' }}>
              Mulai Menjawab
            </button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1>Tahap 6: Post-Test</h1>
            {isLocked && <span style={{ padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary)', borderRadius: '0.5rem', fontWeight: 600 }}>Selesai</span>}
            
            {!isLocked && timeLeft !== null && (
              <div 
                className={timeLeft < 60 ? 'animate-blink' : ''}
                style={{ 
                position: 'fixed', 
                bottom: '2rem', 
                right: '2rem', 
                zIndex: 100,
                background: timeLeft < 60 ? 'var(--error)' : 'var(--surface)', 
                border: `1px solid ${timeLeft < 60 ? 'var(--error)' : 'var(--secondary)'}`,
                color: timeLeft < 60 ? 'white' : 'var(--secondary)',
                padding: '0.75rem 1.5rem', 
                borderRadius: '0.5rem', 
                fontWeight: 'bold',
                fontSize: '1.25rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                transition: 'background 0.3s ease'
              }}>
                ⏳ {formatTime(timeLeft)}
              </div>
            )}
          </div>
          
          <div className="glass-panel">
            {!isLocked && <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Jawab semua pertanyaan sebelum waktu habis. Pertanyaan yang belum dijawab ditandai merah.</p>}
            
            <form onSubmit={handleSubmit}>
              {questions.map((q) => {
                const isUnanswered = answers[q.id] === undefined;
                return (
                  <div key={q.id} style={{ 
                    marginBottom: '2rem', 
                    padding: '1.5rem', 
                    background: 'rgba(255,255,255,0.02)', 
                    borderRadius: '0.5rem',
                    border: (!isLocked && isUnanswered) ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid transparent',
                    transition: 'border 0.3s ease'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', flex: 1 }}>{q.id}. {q.q}</h3>
                      {!isLocked && isUnanswered && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--error)', background: 'rgba(239,68,68,0.1)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>Belum Dijawab</span>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {q.options.map((opt, i) => (
                        <label key={i} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem', 
                          cursor: isLocked ? 'default' : 'pointer', 
                          padding: '0.5rem', 
                          borderRadius: '0.25rem', 
                          background: answers[q.id] === i ? 'rgba(79, 70, 229, 0.2)' : 'transparent', 
                          opacity: isLocked && answers[q.id] !== i ? 0.5 : 1 
                        }}>
                          <input 
                            type="radio" 
                            name={`q-${q.id}`} 
                            value={i} 
                            checked={answers[q.id] === i} 
                            onChange={() => !isLocked && setAnswers({...answers, [q.id]: i})} 
                            disabled={isLocked || timeLeft === 0} 
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {!isLocked && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={saving || timeLeft === 0 || Object.keys(answers).length < questions.length}>
                    {saving ? 'Mengirim...' : 'Kirim Jawaban'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </>
      )}
    </div>
  );
}
