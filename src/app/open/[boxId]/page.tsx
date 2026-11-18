import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { preload } from 'react-dom';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getBoxForOpen, getCardImagePreloadUrls } from '@/lib/get-box-for-open';
import { OpenBoxClient } from './OpenBoxClient';

export const revalidate = 60;

type PageProps = {
  params: Promise<{ boxId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { boxId } = await params;
  const box = await getBoxForOpen(boxId);
  if (!box) {
    return { title: 'Pack' };
  }
  return {
    title: box.name,
    description: box.description || `Open ${box.name} on PullForge`,
  };
}

export default async function OpenBoxPage({ params }: PageProps) {
  const { boxId } = await params;
  const box = await getBoxForOpen(boxId);
  if (!box) {
    notFound();
  }

  for (const url of getCardImagePreloadUrls(box.cards, 16)) {
    preload(url, { as: 'image' });
  }
  if (box.imageUrl) {
    preload(box.imageUrl, { as: 'image' });
  }

  let initialUserCoins: number | null = null;
  const session = await getCurrentSession();
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { coins: true },
    });
    if (user) {
      initialUserCoins = Number(user.coins);
    }
  }

  return <OpenBoxClient initialBox={box} initialUserCoins={initialUserCoins} />;
}