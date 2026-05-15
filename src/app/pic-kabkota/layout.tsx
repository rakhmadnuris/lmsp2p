import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import PicKabkotaClientLayout from './PicKabkotaClientLayout';

export default async function PicKabkotaLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'PIC_KABKOTA') redirect('/login');
  
  const user = await prisma.user.findUnique({ 
    where: { id: session.userId },
    select: { id: true, username: true, role: true, province: true, regencyCity: true }
  });
  if (!user) redirect('/login');

  return <PicKabkotaClientLayout user={user}>{children}</PicKabkotaClientLayout>;
}
