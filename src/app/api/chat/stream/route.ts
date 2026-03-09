import { prisma } from '@/lib/prisma';

// SSE endpoint for real-time chat messages
export async function GET() {
  const encoder = new TextEncoder();
  let lastMessageTime: Date | null = null;
  let knownDeletedIds = new Set<string>();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection event
      controller.enqueue(encoder.encode('event: connected\ndata: {}\n\n'));

      // Get the current time as baseline to avoid sending old messages
      lastMessageTime = new Date();

      // Poll for new messages every 2 seconds
      const poll = async () => {
        if (closed) return;

        try {
          // 1. Poll for new messages (exclude soft-deleted)
          const newMessages = await prisma.chatMessage.findMany({
            where: lastMessageTime
              ? { createdAt: { gt: lastMessageTime }, deletedAt: null }
              : { deletedAt: null },
            orderBy: { createdAt: 'asc' },
            take: 50,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  twitchUsername: true,
                  discordUsername: true,
                  role: true,
                },
              },
            },
          });

          if (newMessages.length > 0) {
            lastMessageTime = newMessages[newMessages.length - 1].createdAt;

            for (const msg of newMessages) {
              const data = JSON.stringify({
                id: msg.id,
                content: msg.content,
                isDeleted: false,
                createdAt: msg.createdAt.toISOString(),
                user: {
                  id: msg.user.id,
                  name: msg.user.twitchUsername || msg.user.discordUsername || msg.user.name || 'Anonymous',
                  image: msg.user.image,
                  isTwitch: !!msg.user.twitchUsername,
                  isDiscord: !!msg.user.discordUsername && !msg.user.twitchUsername,
                  role: msg.user.role,
                },
              });
              controller.enqueue(encoder.encode(`event: message\ndata: ${data}\n\n`));
            }
          }

          // 2. Check for recently deleted messages (soft-deleted within last 10 seconds)
          const recentlyDeleted = await prisma.chatMessage.findMany({
            where: {
              deletedAt: { not: null, gte: new Date(Date.now() - 10000) },
            },
            select: { id: true },
          });

          for (const msg of recentlyDeleted) {
            if (!knownDeletedIds.has(msg.id)) {
              knownDeletedIds.add(msg.id);
              const data = JSON.stringify({ id: msg.id });
              controller.enqueue(encoder.encode(`event: delete\ndata: ${data}\n\n`));
            }
          }

          // Clean up old tracked deletions (keep set manageable)
          if (knownDeletedIds.size > 200) {
            knownDeletedIds = new Set([...knownDeletedIds].slice(-100));
          }

          // Send heartbeat to keep connection alive
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch (error) {
          // Don't crash on DB errors, just skip this poll
          console.error('Chat stream poll error:', error);
        }

        if (!closed) {
          setTimeout(poll, 2000);
        }
      };

      // Start polling
      poll();
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering for SSE
    },
  });
}
