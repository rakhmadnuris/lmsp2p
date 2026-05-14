import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login Peserta | LMS P2P',
  description: 'Masuk ke portal LMS Pendidikan Pengawas Partisipatif untuk mengakses modul pembelajaran dan ujian.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
