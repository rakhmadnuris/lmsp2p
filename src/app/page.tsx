'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import Image from 'next/image';

export default function Home() {
  useEffect(() => {
    // Trap the user on the welcome screen so it becomes the "first page" in their current stack
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <main className={styles.main}>
      {/* ─── Background layers ─── */}
      <div className={styles.bg} />
      <div className={styles.grid} />

      {/* ─── Ambient orbs ─── */}
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />

      {/* ─── Geometric ornaments ─── */}
      <div className={styles.ring1} />
      <div className={styles.ring2} />
      <div className={styles.diamond} />
      <div className={styles.diamond2} />

      {/* ─── Hero content ─── */}
      <div className={styles.hero}>
        {/* Logo in a glass badge */}
        <div className={styles.logoWrapper}>
          <div className={styles.logoBadge}>
            <Image
              src="/logo_p2p.png"
              alt="Logo Bawaslu & P2P"
              width={260}
              height={80}
              className={styles.logo}
              priority
            />
          </div>
        </div>

        {/* Tag pill */}
        <div className={styles.titleWrapper}>
          <div className={styles.titleTag}>Program 2026</div>
          <h1 className={styles.title}>Selamat Datang Peserta P2P 2026</h1>
        </div>

        <p className={styles.subtitle}>Pendidikan Pengawas Partisipatif</p>

        {/* Decorative gold divider */}
        <div className={styles.divider}>
          <span className={styles.dividerBar} />
          <span className={styles.dividerDot} />
          <span className={styles.dividerDot} style={{ width: 8, height: 8, opacity: 0.5 }} />
          <span className={styles.dividerDot} />
          <span className={styles.dividerBarR} />
        </div>

        {/* Cards */}
        <div className={styles.cardContainer}>
          <Link href="/login" className={styles.card}>
            <div
              className={styles.cardIcon}
              style={{ background: 'rgba(255, 43, 43, 0.12)', border: '1px solid rgba(255, 43, 43, 0.2)' }}
            >
              🎓
            </div>
            <h2>Peserta</h2>
            <p>Akses modul pembelajaran, selesaikan tugas, dan pantau kemajuan Anda.</p>
            <div className={styles.button}>Masuk</div>
          </Link>

          <Link href="/admin/login" className={styles.card}>
            <div
              className={styles.cardIcon}
              style={{ background: 'rgba(212, 162, 76, 0.12)', border: '1px solid rgba(212, 162, 76, 0.2)' }}
            >
              ⚙️
            </div>
            <h2>Admin</h2>
            <p>Kelola pengguna, kontrol akses wilayah, dan pantau kemajuan peserta.</p>
            <div className={styles.buttonSecondary}>Akses Admin</div>
          </Link>
        </div>

        <p className={styles.tagline}>Badan Pengawas Pemilihan Umum &nbsp;·&nbsp; P2P 2026</p>
      </div>
    </main>
  );
}
