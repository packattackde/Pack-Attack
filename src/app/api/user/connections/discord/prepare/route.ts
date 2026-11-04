import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createOAuthLinkToken, OAUTH_LINK_COOKIE_OPTIONS } from '@/lib/oauth-link-cookie';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.account.findFirst({
        where: { userId: session.user.id, provider: 'discord' },
        select: { id: true },
    });

    if (existing) {
        return NextResponse.json({ error: 'already_connected' }, { status: 400 });
    }

    const response = NextResponse.json({ ok: true });

    response.cookies.set('discord_link_uid', createOAuthLinkToken(session.user.id), OAUTH_LINK_COOKIE_OPTIONS);

    return response;
}