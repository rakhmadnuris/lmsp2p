import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminClientLayout from '../AdminClientLayout';

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard Admin | LMS P2P',
  description: 'Kelola pengguna, pantau kemajuan peserta, dan tinjau jawaban.',
};

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');
  
  const user = await prisma.user.findUnique({ 
    where: { id: session.userId },
    select: {
      id: true,
      username: true,
      role: true
    }
  });
  if (!user || user.role !== 'ADMIN') redirect('/login');

  return (
    <AdminClientLayout user={user}>
      {children}
    </AdminClientLayout>
  );
}
