import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth';
import { LandingPage } from '@/components/LandingPage';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getCurrentSession();
  if (session?.user?.email) redirect('/dashboard');

  return <LandingPage />;
}
