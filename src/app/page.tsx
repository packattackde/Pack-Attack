import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { titleForLevel, xpProgressInCurrentLevel } from '@/lib/level';
import LiveTicker from '@/components/dashboard/LiveTicker';
import WelcomeWidget from '@/components/dashboard/WelcomeWidget';
import CoinBalanceWidget from '@/components/dashboard/CoinBalanceWidget';
import BestPullWidget from '@/components/dashboard/BestPullWidget';
import StatsWidget from '@/components/dashboard/StatsWidget';
import BattlesWidget from '@/components/dashboard/BattlesWidget';
// FeaturedBoxesWidget removed — replaced by expanded AchievementsWidget
import RecentPullsWidget from '@/components/dashboard/RecentPullsWidget';
import LeaderboardWidget from '@/components/dashboard/LeaderboardWidget';
import AchievementsWidget from '@/components/dashboard/AchievementsWidget';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dashboard | Pack Attack',
  description: 'Your personalized TCG pack opening dashboard',
};

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session?.user?.email) redirect('/login');

  const userEmail = session.user.email;

  const [
    user,
    recentHits,
    recentPulls,
    totalPulls,
    totalBattles,
    battlesWon,
    bestPullToday,
    activeBattles,
    leaderboardEntries,
    userLeaderboard,
    cheapestBox,
  ] = await Promise.all([
    // User profile
    prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        name: true,
        email: true,
        coins: true,
        xp: true,
        level: true,
        levelCoinsEarnedThisMonth: true,
      },
    }),
    // Recent hits (coinValue >= 100, last 3)
    prisma.pull.findMany({
      where: {
        user: { email: userEmail },
        cardId: { not: null },
        cardValue: { gte: 100 },
      },
      orderBy: { timestamp: 'desc' },
      take: 3,
      include: {
        card: { select: { name: true, imageUrlGatherer: true, rarity: true, coinValue: true } },
      },
    }),
    // Recent pulls (last 5, any rarity)
    prisma.pull.findMany({
      where: {
        user: { email: userEmail },
        cardId: { not: null },
      },
      orderBy: { timestamp: 'desc' },
      take: 5,
      include: {
        card: { select: { name: true, imageUrlGatherer: true, rarity: true, coinValue: true } },
      },
    }),
    // Total pulls count
    prisma.pull.count({ where: { user: { email: userEmail } } }),
    // Total battles
    prisma.battleParticipant.count({ where: { user: { email: userEmail } } }),
    // Battles won
    prisma.battle.count({
      where: { winner: { email: userEmail }, status: 'FINISHED' },
    }),
    // Best pull today
    prisma.pull.findFirst({
      where: {
        timestamp: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        cardValue: { not: null },
        cardId: { not: null },
      },
      orderBy: { cardValue: 'desc' },
      include: {
        user: { select: { name: true } },
        card: {
          select: {
            name: true,
            imageUrlGatherer: true,
            rarity: true,
            coinValue: true,
          },
        },
        box: { select: { id: true, name: true } },
      },
    }),
    // Active battles (up to 3)
    prisma.battle.findMany({
      where: { status: { in: ['WAITING'] } },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        box: { select: { name: true } },
        _count: { select: { participants: true } },
      },
    }),
    // Leaderboard top 3
    prisma.battleLeaderboard.findMany({
      where: {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      },
      orderBy: { points: 'desc' },
      take: 3,
      include: { user: { select: { name: true } } },
    }),
    // User's leaderboard entry
    prisma.battleLeaderboard.findFirst({
      where: {
        user: { email: userEmail },
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      },
    }),
    // Cheapest active box
    prisma.box.findFirst({
      where: { isActive: true },
      orderBy: { price: 'asc' },
      select: { price: true },
    }),
  ]);

  if (!user) redirect('/login');

  // Derived data
  const xpProgress = xpProgressInCurrentLevel(user.xp, user.level);
  const title = titleForLevel(user.level);
  const winRate =
    totalBattles > 0 ? Math.round((battlesWon / totalBattles) * 100) : 0;
  const collectionValue = recentPulls.reduce(
    (sum, p) => sum + (p.card?.coinValue ? Number(p.card.coinValue) : 0),
    0
  );

  // Luck streak
  const hitRarities = new Set([
    'rare',
    'holo rare',
    'super rare',
    'epic',
    'ultra rare',
    'legendary',
    'mythic',
    'secret',
    'secret rare',
    'alt art',
    'gold',
    'hyper rare',
  ]);
  let luckStreak = 0;
  for (const pull of recentPulls) {
    const rarity = (pull.card?.rarity || '').toLowerCase().trim();
    if (hitRarities.has(rarity)) luckStreak++;
    else break;
  }

  // Dynamic subtitle
  let dynamicSubtitle = 'Ready to open some packs?';
  if (luckStreak >= 3)
    dynamicSubtitle = `Your luck streak: ${luckStreak} hits in a row!`;
  else if (activeBattles.length > 0)
    dynamicSubtitle = `${activeBattles.length} Battle${activeBattles.length > 1 ? 's' : ''} waiting for you`;

  // Month name for leaderboard
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const currentMonth =
    monthNames[new Date().getMonth()] + ' ' + new Date().getFullYear();

  // Serialize data for client components
  const serializedHits = recentHits.map((p) => ({
    cardName: p.card?.name || 'Unknown Card',
    cardImage: p.card?.imageUrlGatherer || null,
    rarity: p.card?.rarity || 'common',
    coinValue: p.card?.coinValue ? Number(p.card.coinValue) : 0,
    timestamp: p.timestamp.toISOString(),
  }));

  const serializedPulls = recentPulls.map((p) => ({
    cardName: p.card?.name || 'Unknown Card',
    cardImage: p.card?.imageUrlGatherer || null,
    rarity: p.card?.rarity || 'common',
    coinValue: p.card?.coinValue ? Number(p.card.coinValue) : 0,
    timestamp: p.timestamp.toISOString(),
  }));

  const serializedBattles = activeBattles.map((b) => ({
    id: b.id,
    name: b.box.name + ' Battle',
    rounds: b.rounds,
    participants: b._count.participants,
    maxParticipants: b.maxParticipants,
  }));


  const serializedLeaderboard = leaderboardEntries.map((e, i) => ({
    rank: i + 1,
    name: e.user.name || 'Anonymous',
    points: e.points,
  }));

  return (
    <div className="min-h-screen bg-[#06061a] font-display">
      <div className="max-w-[1360px] mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {/* Live Ticker */}
        <LiveTicker className="mb-5" />

        {/* Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-6 lg:grid-cols-12 gap-4 sm:gap-5">
          <WelcomeWidget
            className="sm:col-span-6 lg:col-span-8"
            userName={user.name || 'Player'}
            level={user.level}
            xpInCurrentLevel={xpProgress.current}
            xpForNextLevel={xpProgress.required}
            xpPercent={xpProgress.percent}
            title={title}
            dynamicSubtitle={dynamicSubtitle}
          />

          <CoinBalanceWidget
            className="sm:col-span-6 lg:col-span-4"
            coins={Number(user.coins)}
            cheapestBoxPrice={cheapestBox ? Number(cheapestBox.price) : 0}
            monthlyEarnings={user.levelCoinsEarnedThisMonth}
            monthlyCap={500}
          />

          {bestPullToday && bestPullToday.card && bestPullToday.box ? (
            <BestPullWidget
              className="sm:col-span-3 lg:col-span-4"
              cardName={bestPullToday.card.name}
              cardImage={bestPullToday.card.imageUrlGatherer}
              rarity={bestPullToday.card.rarity}
              coinValue={Number(bestPullToday.card.coinValue)}
              pullerName={bestPullToday.user.name || 'Anonymous'}
              boxId={bestPullToday.box.id}
              boxName={bestPullToday.box.name}
            />
          ) : (
            <BestPullWidget
              className="sm:col-span-3 lg:col-span-4"
              isEmpty
            />
          )}

          <StatsWidget
            className="sm:col-span-3 lg:col-span-4"
            packsOpened={totalPulls}
            battlesWon={battlesWon}
            winRate={winRate}
            collectionValue={collectionValue}
          />

          <BattlesWidget
            className="sm:col-span-3 lg:col-span-4"
            battles={serializedBattles}
          />

          <RecentPullsWidget
            className="sm:col-span-6 lg:col-span-5"
            hits={serializedHits}
            pulls={serializedPulls}
          />

          <AchievementsWidget className="sm:col-span-3 lg:col-span-4" />

          <LeaderboardWidget
            className="sm:col-span-3 lg:col-span-3"
            entries={serializedLeaderboard}
            userRank={userLeaderboard?.rank ?? 0}
            userPoints={userLeaderboard?.points ?? 0}
            month={currentMonth}
          />
        </div>
      </div>
    </div>
  );
}
