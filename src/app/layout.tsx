import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LMS P2P - Pendidikan Pengawas Partisipatif',
  description: 'Sistem Manajemen Pembelajaran Pendidikan Pengawas Partisipatif',
};

export const viewport = {
  themeColor: '#0D0D0F',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <div className="app-container">
          {children}
        </div>
      </body>
    </html>
  );
}
