import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminClientLayout from '../AdminClientLayout';

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');
  
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.role !== 'ADMIN') redirect('/login');

  return (
    <AdminClientLayout user={user}>
      {children}
    </AdminClientLayout>
  );
}
