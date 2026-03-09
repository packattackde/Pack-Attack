import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { filterMessage } from '@/lib/chat-filter';
import { getUserChatBanStatus } from '@/lib/chat-ban';

// In-memory rate limiting (per user, 1 message per second)
const rateLimitMap = new Map<string, number>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const lastMessage = rateLimitMap.get(userId);
  if (lastMessage && now - lastMessage < 1000) {
    return false;
  }
  rateLimitMap.set(userId, now);
  if (rateLimitMap.size > 1000) {
    const cutoff = now - 60000;
    for (const [key, time] of rateLimitMap) {
      if (time < cutoff) rateLimitMap.delete(key);
    }
  }
  return true;
}

const MAX_VISIBLE_MESSAGES = 20;

// GET: Load recent messages
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || String(MAX_VISIBLE_MESSAGES)), 100);
  const includeBanStatus = searchParams.get('banStatus') === 'true';

  try {
    const messages = await prisma.chatMessage.findMany({
      take: limit,
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
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

    // Reverse so oldest is first (for chat display)
    const sorted = messages.reverse();

    // Optionally include ban status for the current user
    let banStatus = null;
    if (includeBanStatus) {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        const status = await getUserChatBanStatus(session.user.id);
        banStatus = {
          banned: status.banned,
          type: status.type,
          expiresAt: status.expiresAt?.toISOString() || null,
          reason: status.reason,
        };
      }
    }

    return NextResponse.json({
      success: true,
      messages: sorted.map((msg) => ({
        id: msg.id,
        content: msg.deletedAt ? '[message deleted]' : msg.content,
        isDeleted: !!msg.deletedAt,
        createdAt: msg.createdAt.toISOString(),
        user: {
          id: msg.user.id,
          image: msg.user.image,
          name: msg.user.twitchUsername || msg.user.discordUsername || msg.user.name || 'Anonymous',
          isTwitch: !!msg.user.twitchUsername,
          isDiscord: !!msg.user.discordUsername && !msg.user.twitchUsername,
          role: msg.user.role,
        },
      })),
      ...(banStatus !== null ? { banStatus } : {}),
    });
  } catch (error) {
    console.error('Chat GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load messages' }, { status: 500 });
  }
}

// POST: Send a message
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Sign in to chat' }, { status: 401 });
  }

  // Rate limit
  if (!checkRateLimit(session.user.id)) {
    return NextResponse.json({ error: 'Slow down! 1 message per second.' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const content = (body.content || '').trim();

    if (!content) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json({ error: 'Message too long (max 500 chars)' }, { status: 400 });
    }

    // Check ban/timeout status
    const banStatus = await getUserChatBanStatus(session.user.id);
    if (banStatus.banned) {
      return NextResponse.json({
        error: banStatus.type === 'BAN'
          ? 'You are permanently banned from chat.'
          : `You are timed out until ${banStatus.expiresAt?.toLocaleString()}.`,
        banStatus: {
          banned: true,
          type: banStatus.type,
          expiresAt: banStatus.expiresAt?.toISOString() || null,
          reason: banStatus.reason,
        },
      }, { status: 403 });
    }

    // Get user role for filter
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, name: true, twitchUsername: true, discordUsername: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Content filter check
    const filterResult = filterMessage(content, user.role);
    if (!filterResult.allowed) {
      return NextResponse.json({ error: filterResult.reason }, { status: 400 });
    }

    // Create the message
    const message = await prisma.chatMessage.create({
      data: {
        content,
        userId: session.user.id,
      },
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

    // Archive to ChatLog
    const displayName = message.user.twitchUsername || message.user.discordUsername || message.user.name || 'Anonymous';
    await prisma.chatLog.create({
      data: {
        originalId: message.id,
        content: message.content,
        userId: message.userId,
        userName: displayName,
        userRole: message.user.role,
        createdAt: message.createdAt,
      },
    }).catch((err) => console.error('ChatLog archive error:', err));

    // Fire-and-forget cleanup: keep only the newest messages
    void (async () => {
      try {
        const count = await prisma.chatMessage.count({ where: { deletedAt: null } });
        if (count > MAX_VISIBLE_MESSAGES) {
          const oldestToKeep = await prisma.chatMessage.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            take: MAX_VISIBLE_MESSAGES,
            select: { id: true },
          });
          const keepIds = oldestToKeep.map((m) => m.id);
          await prisma.chatMessage.deleteMany({
            where: { id: { notIn: keepIds }, deletedAt: null },
          });
        }
      } catch (err) {
        console.error('Chat cleanup error:', err);
      }
    })();

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        isDeleted: false,
        createdAt: message.createdAt.toISOString(),
        user: {
          id: message.user.id,
          name: displayName,
          image: message.user.image,
          isTwitch: !!message.user.twitchUsername,
          isDiscord: !!message.user.discordUsername,
          role: message.user.role,
        },
      },
    });
  } catch (error) {
    console.error('Chat POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 });
  }
}
