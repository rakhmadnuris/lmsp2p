'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import BackButtonHandler from '../dashboard/BackButtonHandler';

export default function StagesLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Extract stage number from pathname (e.g., /stages/2 -> 2)
  const currentStageNum = parseInt(pathname.split('/').pop() || '1');
  const prevStageNum = currentStageNum > 1 ? currentStageNum - 1 : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-color)' }}>
      <BackButtonHandler />
      <header style={{ padding: '1rem 2rem', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: 'var(--primary)', fontSize: '1.25rem' }}>Tahap Pembelajaran {currentStageNum}</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {prevStageNum && (
            <button 
              onClick={() => router.push(`/stages/${prevStageNum}`)} 
              className="btn" 
              style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)' }}
            >
              ← Tahap Sebelumnya
            </button>
          )}
          <Link href="/dashboard" className="btn" style={{ padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none' }}>
            Beranda
          </Link>
        </div>
      </header>
      <main style={{ flex: 1, padding: '2rem' }}>
        {children}
      </main>
    </div>
  );
}
