type BattleNotification = {
    battleId: string;
    boxName: string;
    boxImageUrl?: string;
    players: number;
    rounds: number;
    winCondition: string;
    privacy: 'PUBLIC' | 'PRIVATE';
    entryCost: number;
    creatorUsername: string;
};

const winConditionEmoji: Record<string, string> = {
    LOWEST_CARD: '⬇️',
    HIGHEST_CARD: '⬆️',
    ALL_CARDS: '🃏',
};

const winConditionNames: Record<string, string> = {
    LOWEST_CARD: 'Niedrigste Karte',
    HIGHEST_CARD: 'Höchste Karte',
    ALL_CARDS: 'Alle Karten',
};

export async function sendBattleNotificationWebhook(battle: BattleNotification) {
    const webhookUrl = process.env.DISCORD_BATTLE_WEBHOOK_URL;
    if (!webhookUrl) {
        console.error('DISCORD_BATTLE_WEBHOOK_URL not configured');
        return;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const battleUrl = `${appUrl}/battles/${battle.battleId}`;

    const battleIdShort = battle.battleId.slice(-6);

    const embed = {
        title: `Neues Battle erstellt! #${battleIdShort}`,
        description: `**${battle.creatorUsername}** hat ein neues Battle gestartet!\n\n[Jetzt beitreten!](${battleUrl})`,
        color: 0x8b5cf6,
        fields: [
            { name: 'Box', value: battle.boxName, inline: true },
            { name: 'Spieler', value: `${battle.players} Spieler`, inline: true },
            { name: 'Runden', value: `${battle.rounds}`, inline: true },
            {
                name: `${winConditionEmoji[battle.winCondition] ?? ''} Spielmodus`,
                value: winConditionNames[battle.winCondition] ?? battle.winCondition,
                inline: true,
            },
            { name: 'Einsatz', value: `${battle.entryCost.toLocaleString()} Coins`, inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'Klicke auf den Link um beizutreten!' },
    };

    const payload = {
        username: 'Pack-Attack Bot',
        content: '<@&1471928307904807035>',
        embeds: [embed],
    };

    try {
        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const text = await res.text().catch(() => '');
            console.error('Discord webhook failed:', res.status, text);
            throw new Error(`Discord webhook failed: ${res.status}`);
        }

        console.log('Battle notification sent via Discord webhook');
    } catch (error) {
        console.error('Error sending Discord webhook:', error);
        throw error;
    }
}
