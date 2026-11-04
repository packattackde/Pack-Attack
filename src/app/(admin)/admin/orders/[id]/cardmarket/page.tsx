import { notFound, redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CardmarketFulfillClient } from './CardmarketFulfillClient';

export default async function OrderCardmarketFulfillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCurrentSession();
  if (!session?.user?.email) redirect('/login');

  const admin = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!admin || admin.role !== 'ADMIN') redirect('/dashboard');

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) notFound();

  return <CardmarketFulfillClient orderId={order.id} />;
}
