import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { BattleClient } from './BattleClient';
import { BattleDrawClient } from './BattleDrawClient';

async function getBattle(id: string) {
  const battle = await prisma.battle.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      box: {
        include: {
          cards: {
            orderBy: { coinValue: 'desc' },
            take: 3,
          },
        },
      },
      roundBoxes: {
        include: { box: true },
        orderBy: { roundNumber: 'asc' },
      },
      participants: {
        include: { user: { select: { id: true, name: true, email: true, isBot: true } } },
      },
      winner: { select: { id: true, name: true, email: true } },
      pulls: {
        include: {
          participant: { include: { user: true } },
          pull: { include: { card: true } },
        },
        orderBy: [{ roundNumber: 'asc' }, { pulledAt: 'asc' }],
      },
    },
  });

  if (!battle) return null;

  // Serialize to JSON and back to convert Date objects to strings
  const serialized = JSON.parse(JSON.stringify({
    ...battle,
    entryFee: Number(battle.entryFee),
    box: battle.box ? {
      ...battle.box,
      price: Number(battle.box.price),
      cards: battle.box.cards?.map(c => ({
        ...c,
        coinValue: Number(c.coinValue),
        pullRate: Number(c.pullRate),
      })),
    } : null,
    roundBoxes: (battle as any).roundBoxes?.map((rb: any) => ({
      ...rb,
      box: { ...rb.box, price: Number(rb.box.price) },
    })) || [],
    pulls: battle.pulls?.map(pull => ({
      ...pull,
      coinValue: Number(pull.coinValue),
      pull: pull.pull ? {
        ...pull.pull,
        cardValue: pull.pull.cardValue ? Number(pull.pull.cardValue) : null,
        card: pull.pull.card ? {
          ...pull.pull.card,
          pullRate: Number(pull.pull.card.pullRate),
          coinValue: Number(pull.pull.card.coinValue),
        } : null,
      } : null,
    })),
    participants: battle.participants.map(p => ({
      ...p,
      totalValue: Number(p.totalValue),
    })),
  }));

  return serialized;
}

export default async function BattlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const battle = await getBattle(id);

  if (!battle) notFound();

  const session = await getCurrentSession();
  let currentUserId: string | null = null;

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    currentUserId = user?.id || null;
  }

  const isAdmin = session?.user?.role === 'ADMIN';

  // OPEN, FULL, READY, ACTIVE -> live lobby/game view
  if (['OPEN', 'FULL', 'READY', 'ACTIVE'].includes(battle.status)) {
    return <BattleDrawClient battle={battle} currentUserId={currentUserId} isAdmin={isAdmin} />;
  }

  // FINISHED_WIN, FINISHED_DRAW, CANCELLED -> results view
  return <BattleClient battle={battle} currentUserId={currentUserId} isAdmin={isAdmin} />;
}
