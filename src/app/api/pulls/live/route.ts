import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// Minimum coin value for a pull to appear in the live ticker
const MIN_COIN_VALUE = 100;

const POLL_INTERVAL_MS = 3000;
const KEEPALIVE_INTERVAL_MS = 30000;

export async function GET(_request: NextRequest) {
  const encoder = new TextEncoder();
  let lastTimestamp = new Date();
  let closed = false;
  let keepaliveTimer: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection event
      controller.enqueue(encoder.encode('event: connected\ndata: {}\n\n'));

      // Keepalive comment every 30 seconds
      keepaliveTimer = setInterval(() => {
        if (!closed) {
          try {
            controller.enqueue(encoder.encode(': keepalive\n\n'));
          } catch {
            // Controller may be closed
            closed = true;
          }
        }
      }, KEEPALIVE_INTERVAL_MS);

      const poll = async () => {
        if (closed) return;

        try {
          const newPulls = await prisma.pull.findMany({
            where: {
              timestamp: { gt: lastTimestamp },
              cardId: { not: null },
            },
            include: {
              user: { select: { id: true, name: true } },
              card: { select: { id: true, name: true, imageUrlGatherer: true, rarity: true, coinValue: true } },
              box: { select: { id: true, name: true } },
            },
            orderBy: { timestamp: 'desc' },
            take: 20,
          });

          // Always advance lastTimestamp to the newest pull to avoid re-fetching
          if (newPulls.length > 0) {
            lastTimestamp = newPulls[0].timestamp;
          }

          const hitPulls = newPulls
            .filter(p => p.card && Number(p.card.coinValue || 0) >= MIN_COIN_VALUE)
            .slice(0, 5);

          if (hitPulls.length > 0) {
            for (const pull of hitPulls) {
              const data = JSON.stringify({
                pullId: pull.id,
                userId: pull.user.id,
                userName: pull.user.name,
                cardId: pull.card!.id,
                cardName: pull.card!.name,
                cardImage: pull.card!.imageUrlGatherer,
                rarity: pull.card!.rarity,
                coinValue: Number(pull.card!.coinValue),
                boxId: pull.box.id,
                boxName: pull.box.name,
                timestamp: pull.timestamp.toISOString(),
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
        } catch (error) {
          console.error('[Live Pulls] Poll error:', error);
        }

        if (!closed) {
          setTimeout(poll, POLL_INTERVAL_MS);
        }
      };

      poll();
    },
    cancel() {
      closed = true;
      if (keepaliveTimer) {
        clearInterval(keepaliveTimer);
        keepaliveTimer = null;
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
