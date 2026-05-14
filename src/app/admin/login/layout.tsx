import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portal Admin | LMS P2P',
  description: 'Login aman untuk administrator LMS Pendidikan Pengawas Partisipatif.',
};

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
