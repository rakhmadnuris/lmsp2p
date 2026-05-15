import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import PicProvinsiClientLayout from './PicProvinsiClientLayout';

export default async function PicProvinsiLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'PIC_PROVINSI') redirect('/login');
  
  const user = await prisma.user.findUnique({ 
    where: { id: session.userId },
    select: { id: true, username: true, role: true, province: true }
  });
  if (!user) redirect('/login');

  return <PicProvinsiClientLayout user={user}>{children}</PicProvinsiClientLayout>;
}
