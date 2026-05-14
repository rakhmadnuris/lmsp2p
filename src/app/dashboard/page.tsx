import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ProgressHeader from './ProgressHeader';

export default async function DashboardOverview() {
  const session = await getSession();
  if (!session) redirect('/login');
  
  const user = await prisma.user.findUnique({ 
    where: { id: session.userId },
    include: { certificate: true }
  });
  if (!user) redirect('/login');

  const { currentStage, stage3Unlocked, stage5Unlocked, stage6Unlocked } = user;

  const stages = [
    { num: 1, title: 'Tahap 1: Belajar Mandiri', desc: 'Tonton materi audio-visual dan berikan catatan kritis.', locked: false },
    { num: 2, title: 'Tahap 2: E-Modul', desc: 'Baca materi pembelajaran dan kirimkan refleksi Anda.', locked: currentStage < 2 },
    { num: 3, title: 'Tahap 3: Pre-Test', desc: 'Ikuti penilaian awal.', locked: currentStage < 3 || !stage3Unlocked },
    { num: 4, title: 'Tahap 4: Diskusi', desc: 'Ikuti sesi pendalaman daring.', locked: currentStage < 4 },
    { num: 5, title: 'Tahap 5: Rencana Tindak Lanjut', desc: 'Kirimkan rencana implementasi RTL Anda.', locked: currentStage < 5 || !stage5Unlocked },
    { num: 6, title: 'Tahap 6: Post-Test', desc: 'Ikuti penilaian akhir.', locked: currentStage < 6 || !stage6Unlocked },
    { num: 7, title: 'Tahap 7: Sertifikat', desc: 'Isi data untuk pembuatan sertifikat resmi.', locked: currentStage < 7 },
  ];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #fff, rgba(212,162,76,0.9))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.25rem' }}>Selamat datang, {user.username}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Program Pendidikan Pengawas Partisipatif 2026</p>
      </div>
      
      <div className="glass-panel">
        <ProgressHeader currentStage={currentStage} hasCertificate={!!user.certificate} />
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          {currentStage > 7 
            ? 'Selamat! Anda telah menyelesaikan semua tahap program.' 
            : `Anda saat ini berada di Tahap ${currentStage}. Selesaikan materi secara berurutan untuk membuka tahap berikutnya.`}
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {stages.map(s => {
            const isCompleted = currentStage > s.num;
            const isCurrent = currentStage === s.num;
            const isLocked = s.locked;

            let bgColor = 'rgba(255,255,255,0.02)';
            let borderColor = 'rgba(255,255,255,0.07)';
            let statusText = 'Terkunci';
            let statusStyle: any = { background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.08)' };

            if (isCompleted) {
              bgColor = 'rgba(16,185,129,0.07)';
              borderColor = 'rgba(16,185,129,0.25)';
              statusText = 'Selesai';
              statusStyle = { background: 'rgba(16,185,129,0.15)', color: '#4ade80', border: '1px solid rgba(16,185,129,0.3)' };
            } else if (isCurrent) {
              if (isLocked) {
                bgColor = 'rgba(255,43,43,0.06)';
                borderColor = 'rgba(255,43,43,0.25)';
                statusText = 'Menunggu Admin Membuka';
                statusStyle = { background: 'rgba(255,43,43,0.15)', color: 'var(--error)', border: '1px solid rgba(255,43,43,0.3)' };
              } else {
                bgColor = 'rgba(212,162,76,0.07)';
                borderColor = 'rgba(212,162,76,0.25)';
                statusText = 'Sedang Berlangsung';
                statusStyle = { background: 'rgba(212,162,76,0.15)', color: 'var(--gold-light)', border: '1px solid rgba(212,162,76,0.3)' };
              }
            }

            return (
              <div key={s.num} style={{ 
                padding: '1.25rem 1.5rem', 
                background: bgColor, 
                border: `1px solid ${borderColor}`, 
                borderRadius: '0.875rem', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                opacity: isLocked && !isCurrent ? 0.5 : 1,
                transition: 'all 0.2s ease',
              }}>
                <div>
                  <h3 style={{ color: 'var(--text-main)', marginBottom: '0.25rem' }}>{s.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{s.desc}</p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {isCurrent && !isLocked && (
                    <Link href={`/stages/${s.num}`} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                      Lanjutkan
                    </Link>
                  )}
                  {isCompleted && (
                    <Link href={`/stages/${s.num}`} className="btn" style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--secondary)', color: 'var(--secondary)' }}>
                      Tinjau
                    </Link>
                  )}
                  <span style={{ padding: '0.4rem 0.875rem', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', ...statusStyle }}>
                    {statusText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
