import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardClientLayout from './DashboardClientLayout';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');
  
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect('/login');

  const { currentStage, stage3Unlocked, stage5Unlocked, stage6Unlocked } = user;

  const stages = [
    { num: 1, title: 'Tahap 1: Belajar Mandiri', locked: false },
    { num: 2, title: 'Tahap 2: E-Modul', locked: currentStage < 2 },
    { num: 3, title: 'Tahap 3: Pre-Test', locked: currentStage < 3 || !stage3Unlocked },
    { num: 4, title: 'Tahap 4: Diskusi', locked: currentStage < 4 },
    { num: 5, title: 'Tahap 5: RTL', locked: currentStage < 5 || !stage5Unlocked },
    { num: 6, title: 'Tahap 6: Post-Test', locked: currentStage < 6 || !stage6Unlocked },
    { num: 7, title: 'Tahap 7: Sertifikat', locked: currentStage < 7 },
  ];

  return (
    <DashboardClientLayout user={user} stages={stages}>
      {children}
    </DashboardClientLayout>
  );
}
