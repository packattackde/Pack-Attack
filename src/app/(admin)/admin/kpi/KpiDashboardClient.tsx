'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Euro,
  Eye,
  AlertTriangle,
  BadgeDollarSign,
  Truck,
  Sparkles,
  Swords,
  Loader2,
  Info,
  Package,
  RefreshCw,
  Coins,
} from 'lucide-react';
import type { KpiPayload, KpiRangeDays } from '@/lib/kpi/types';
import { COIN_PACKAGE_EUR_TIERS } from '@/lib/kpi/types';
import { COIN_EUR_RATE } from '@/lib/kpi/coin-eur';
import { buildKpiMockData } from '@/lib/kpi/kpi-mock-data';

const PACKAGE_COLORS: Record<string, string> = {
  '5': 'bg-slate-400',
  '10': 'bg-blue-400',
  '25': 'bg-[#ff2ea6]',
  '50': 'bg-orange-400',
  '100': 'bg-amber-400',
  '250': 'bg-yellow-300',
};

function formatEur(n: number): string {
  if (n >= 10_000) return `€${(n / 1000).toFixed(1)}k`;
  return `€${n.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDateShort(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('de-DE', { month: 'short', day: 'numeric' });
}

function maxOf(values: number[]): number {
  const m = Math.max(...values, 0);
  return m > 0 ? m : 1;
}

function BarChart({
  series,
  max,
  className = 'bg-[#ff2ea6]/60 hover:bg-[#ff2ea6]/80',
}: {
  series: Array<{ date: string; value: number }>;
  max: number;
  className?: string;
}) {
  if (series.length === 0) {
    return <p className="text-xs text-gray-600 py-8 text-center">Keine Daten im Zeitraum.</p>;
  }
  return (
    <div className="flex items-end gap-[2px] h-32">
      {series.map((entry) => {
        const height = max > 0 ? (entry.value / max) * 100 : 0;
        return (
          <div key={entry.date} className="flex-1 group relative min-w-0">
            <div
              className={`w-full rounded-t transition-colors cursor-default ${className}`}
              style={{ height: `${Math.max(height, entry.value > 0 ? 4 : 2)}%` }}
            />
            <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-[#12123a] text-[10px] text-white whitespace-nowrap z-10 border border-white/10">
              {formatDateShort(entry.date)}: {entry.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MultiBarChart({
  rows,
  keys,
  colors,
}: {
  rows: Array<{ date: string; values: Record<string, number> }>;
  keys: string[];
  colors: Record<string, string>;
}) {
  const max = maxOf(rows.map((r) => keys.reduce((s, k) => s + (r.values[k] ?? 0), 0)));
  if (rows.length === 0) return null;
  return (
    <div className="flex items-end gap-[2px] h-32">
      {rows.map((row) => {
        const total = keys.reduce((s, k) => s + (row.values[k] ?? 0), 0);
        const height = max > 0 ? (total / max) * 100 : 0;
        return (
          <div key={row.date} className="flex-1 group relative min-w-0 h-full flex flex-col justify-end">
            <div className="w-full flex flex-col-reverse rounded-t overflow-hidden" style={{ height: `${Math.max(height, total > 0 ? 4 : 2)}%` }}>
              {keys.map((k) => {
                const v = row.values[k] ?? 0;
                if (v === 0) return null;
                const seg = total > 0 ? (v / total) * 100 : 0;
                return (
                  <div key={k} className={`w-full ${colors[k] ?? 'bg-gray-500'}`} style={{ height: `${seg}%` }} />
                );
              })}
            </div>
            <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-[#12123a] text-[10px] text-white whitespace-nowrap z-10 border border-white/10">
              {formatDateShort(row.date)}: {total}
            </div>
          </div>
        );
      })}
    </div>
  );
}

type KpiDashboardClientProps = {
  /** Public mockup route — no API, no admin session. */
  previewMode?: boolean;
};

export default function KpiDashboardClient({ previewMode = false }: KpiDashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mockParam = previewMode || searchParams.get('mock') === '1';
  const rangeParam = Number(searchParams.get('range') ?? '30');
  const urlRange: KpiRangeDays = rangeParam === 7 || rangeParam === 90 ? rangeParam : 30;
  const [previewRange, setPreviewRange] = useState<KpiRangeDays>(30);
  const rangeDays = previewMode ? previewRange : urlRange;

  const [data, setData] = useState<KpiPayload | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const loadSeq = useRef(0);

  const load = useCallback(
    (options?: { background?: boolean }) => {
      const background = options?.background ?? false;
      if (!background) {
        setInitialLoading(true);
        setError(null);
      } else {
        setRefreshing(true);
        setRefreshError(null);
      }
      if (previewMode) {
        setData(buildKpiMockData(rangeDays));
        setLastUpdatedAt(new Date());
        setInitialLoading(false);
        setRefreshing(false);
        return;
      }
      const q = new URLSearchParams({ range: String(rangeDays) });
      if (mockParam) q.set('mock', '1');
      const reqId = ++loadSeq.current;
      fetch(`/api/admin/kpi?${q}`, { cache: 'no-store' })
        .then((res) => res.json())
        .then((json) => {
          if (loadSeq.current !== reqId) return;
          if (!json.success) {
            if (background) {
              setRefreshError(json.error || 'Aktualisierung fehlgeschlagen');
              return;
            }
            setError(json.error || 'Laden fehlgeschlagen');
            setData(null);
            return;
          }
          setData(json.data);
          setLastUpdatedAt(new Date());
          setRefreshError(null);
        })
        .catch(() => {
          if (loadSeq.current !== reqId) return;
          if (background) {
            setRefreshError('Netzwerkfehler beim Aktualisieren');
            return;
          }
          setError('Netzwerkfehler');
          setData(null);
        })
        .finally(() => {
          if (loadSeq.current !== reqId) return;
          setInitialLoading(false);
          setRefreshing(false);
        });
    },
    [rangeDays, mockParam, previewMode],
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (previewMode || mockParam) return;
    const id = window.setInterval(() => load({ background: true }), 60_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') load({ background: true });
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load, previewMode, mockParam]);

  const setRange = (r: KpiRangeDays) => {
    if (previewMode) {
      setPreviewRange(r);
      return;
    }
    const q = new URLSearchParams(searchParams.toString());
    q.set('range', String(r));
    router.push(`/admin/kpi?${q.toString()}`);
  };

  const toggleMock = () => {
    if (previewMode) return;
    const q = new URLSearchParams(searchParams.toString());
    if (mockParam) q.delete('mock');
    else q.set('mock', '1');
    router.push(`/admin/kpi?${q.toString()}`);
  };

  const pnlSeries = useMemo(() => {
    if (!data) return { revenue: [], cost: [], profit: [] };
    return {
      revenue: data.pnlByDay.map((d) => ({ date: d.date, value: d.revenueEur })),
      cost: data.pnlByDay.map((d) => ({ date: d.date, value: d.costEur })),
      profit: data.pnlByDay.map((d) => ({ date: d.date, value: d.profitEur })),
    };
  }, [data]);

  const packageStack = useMemo(() => {
    if (!data) return [];
    return data.coinPackagesByDay.map((d) => ({
      date: d.date,
      values: d.byPrice,
    }));
  }, [data]);

  if (initialLoading) {
    return (
      <div className="min-h-screen font-display flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#ff2ea6] animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen font-display flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">{error ?? 'Keine Daten'}</p>
        <button type="button" onClick={() => load()} className="text-sm text-[#ff2ea6] hover:underline">
          Erneut versuchen
        </button>
      </div>
    );
  }

  const { summary } = data;
  const maxPnl = maxOf([
    ...pnlSeries.revenue.map((x) => x.value),
    ...pnlSeries.cost.map((x) => x.value),
    ...pnlSeries.profit.map((x) => x.value),
  ]);

  return (
    <div className="min-h-screen font-display">
      <div className="fixed inset-0 bg-grid opacity-30" />
      <div className="fixed inset-0 radial-gradient" />

      <div className="relative container py-8 sm:py-12">
        <Link
          href={previewMode ? '/' : '/admin'}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#f0f0f5] transition-colors font-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {previewMode ? 'Zur Startseite' : 'Zurück zum Admin'}
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff2ea6] to-[#E879F9]">
                KPI
              </span>{' '}
              Command Center
            </h1>
            <p className="text-[#8888aa] text-sm">
              Zeitraum: {rangeDays} Tage · Zeitzone {data.timezone}
              {lastUpdatedAt && (
                <>
                  {' '}
                  · Stand{' '}
                  {lastUpdatedAt.toLocaleTimeString('de-DE', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                  {refreshing && ' (lädt…)'}
                </>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {([7, 30, 90] as KpiRangeDays[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  rangeDays === r
                    ? 'bg-[#ff2ea6] border-[#ff2ea6] text-white'
                    : 'border-white/10 text-[#8888aa] hover:text-white hover:border-white/20'
                }`}
              >
                {r}d
              </button>
            ))}
            {!previewMode && (
              <button
                type="button"
                onClick={() => load({ background: true })}
                disabled={refreshing}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-white/10 text-[#8888aa] hover:text-white hover:border-white/20 inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                Aktualisieren
              </button>
            )}
            {!previewMode && (
              <button
                type="button"
                onClick={toggleMock}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                  mockParam || data.mock
                    ? 'border-amber-500/50 text-amber-300 bg-amber-500/10'
                    : 'border-white/10 text-[#8888aa] hover:text-white'
                }`}
              >
                {mockParam || data.mock ? 'Mock ●' : 'Live-Daten'}
              </button>
            )}
          </div>
        </div>

        {(mockParam || data.mock) && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Vorschau mit Beispieldaten — Umschalter oben rechts für Live-Daten aus der Datenbank.
          </div>
        )}

        {refreshError && !mockParam && !data.mock && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {refreshError} — angezeigte Werte sind vom letzten erfolgreichen Abruf.
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <StatCard icon={Euro} label="Erlöse (Zeitraum)" value={formatEur(summary.revenueEur)} accent="text-[#E879F9]" />
          <StatCard icon={TrendingUp} label="Kosten (Zeitraum)" value={formatEur(summary.costEur)} accent="text-orange-400" />
          <StatCard icon={BarChart3} label="Gewinn (Zeitraum)" value={formatEur(summary.profitEur)} accent="text-cyan-400" />
          <StatCard icon={Eye} label="HP Hits heute" value={String(summary.hpHitsToday)} accent="text-blue-400" />
          <StatCard icon={AlertTriangle} label="Rekl. offen" value={String(summary.openComplaints)} accent="text-amber-400" />
          <StatCard icon={Sparkles} label="EV/Karte heute" value={summary.avgEvPerCardToday.toFixed(2)} accent="text-[#ff2ea6]" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <MiniStat label="Pack-Öffnungen (heute)" value={summary.packsOpenedToday} />
          <MiniStat label="Coins für Packs (heute)" value={summary.packCoinsSpentToday.toFixed(2)} />
          <MiniStat label="Karten verkauft (heute)" value={summary.cardsSoldToday} />
          <MiniStat label="Lieferaufträge (heute)" value={summary.deliveryOrdersToday} />
          <MiniStat label="Liefer-Karten (heute)" value={summary.deliveryCardsToday} />
          <MiniStat label="Battles / Runden (heute)" value={`${summary.battlesToday} / ${summary.roundsToday}`} />
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-[#1e1e55]/80 p-4 mb-8 flex gap-2 text-xs text-[#8888aa]">
          <Info className="w-4 h-4 shrink-0 text-[#E879F9]" />
          <p>
            Gewinn = Erlöse (Coin-Käufe) minus Kosten (Kartenverkäufe + Versand + Pack-Öffnungen in Coins ×{' '}
            {COIN_EUR_RATE} €/Coin). Pack-Aktivität siehe „Pack-Öffnungen“. HP-Hits ohne Dedupe. Auto-Refresh 60s.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ChartCard title="Erlöse pro Tag" icon={Euro}>
            <BarChart series={pnlSeries.revenue} max={maxPnl} className="bg-[#E879F9]/70 hover:bg-[#E879F9]" />
          </ChartCard>
          <ChartCard title="Kosten pro Tag" icon={TrendingUp}>
            <BarChart series={pnlSeries.cost} max={maxPnl} className="bg-orange-500/60 hover:bg-orange-500/80" />
          </ChartCard>
          <ChartCard title="Gewinn pro Tag" icon={BarChart3}>
            <BarChart series={pnlSeries.profit} max={maxPnl} className="bg-cyan-500/60 hover:bg-cyan-500/80" />
          </ChartCard>
          <ChartCard title="Coin-Pakete (5/10/25/50/100/250 €)" icon={BadgeDollarSign}>
            <MultiBarChart
              rows={packageStack}
              keys={COIN_PACKAGE_EUR_TIERS.map(String)}
              colors={PACKAGE_COLORS}
            />
            <div className="flex flex-wrap gap-3 mt-4">
              {COIN_PACKAGE_EUR_TIERS.map((tier) => (
                <span key={tier} className="text-[10px] text-[#8888aa] flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${PACKAGE_COLORS[String(tier)]}`} />
                  {tier}€: {data.coinPackagesRangeTotal[String(tier)] ?? 0}
                </span>
              ))}
            </div>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ChartCard title="Homepage Hits / Tag" icon={Eye}>
            <BarChart
              series={data.hpHitsByDay.map((d) => ({ date: d.date, value: d.count }))}
              max={maxOf(data.hpHitsByDay.map((d) => d.count))}
            />
          </ChartCard>
          <ChartCard title="Reklamationen eröffnet / Tag" icon={AlertTriangle}>
            <BarChart
              series={data.complaintsOpenedByDay.map((d) => ({ date: d.date, value: d.count }))}
              max={maxOf(data.complaintsOpenedByDay.map((d) => d.count))}
              className="bg-amber-500/60 hover:bg-amber-500/80"
            />
            <p className="text-[10px] text-[#8888aa] mt-2">Kategorien: Pack, Battle, Shop, General</p>
          </ChartCard>
          <ChartCard title="Pack-Öffnungen / Tag" icon={Package}>
            <BarChart
              series={data.packsOpenedByDay.map((d) => ({ date: d.date, value: d.count }))}
              max={maxOf(data.packsOpenedByDay.map((d) => d.count))}
              className="bg-[#ff2ea6]/60 hover:bg-[#ff2ea6]/80"
            />
          </ChartCard>
          <ChartCard title="Coins für Packs / Tag" icon={Coins}>
            <BarChart
              series={data.packCoinsSpentByDay.map((d) => ({ date: d.date, value: d.count }))}
              max={maxOf(data.packCoinsSpentByDay.map((d) => d.count))}
              className="bg-amber-500/60 hover:bg-amber-500/80"
            />
          </ChartCard>
          <ChartCard title="Verkaufte Karten / Tag" icon={BadgeDollarSign}>
            <BarChart
              series={data.cardsSoldByDay.map((d) => ({ date: d.date, value: d.count }))}
              max={maxOf(data.cardsSoldByDay.map((d) => d.count))}
              className="bg-purple-500/60 hover:bg-purple-500/80"
            />
          </ChartCard>
          <ChartCard title="Lieferung: Aufträge & Karten" icon={Truck}>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] uppercase text-[#8888aa] mb-1">Aufträge</p>
                <BarChart
                  series={data.deliveryByDay.map((d) => ({ date: d.date, value: d.orders }))}
                  max={maxOf(data.deliveryByDay.map((d) => d.orders))}
                  className="bg-indigo-500/60 hover:bg-indigo-500/80"
                />
              </div>
              <div>
                <p className="text-[10px] uppercase text-[#8888aa] mb-1">Karten</p>
                <BarChart
                  series={data.deliveryByDay.map((d) => ({ date: d.date, value: d.cards }))}
                  max={maxOf(data.deliveryByDay.map((d) => d.cards))}
                  className="bg-teal-500/60 hover:bg-teal-500/80"
                />
              </div>
            </div>
          </ChartCard>
        </div>

        <ChartCard title="Expected Value pro Karte & Battles" icon={Swords} className="mb-8">
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] uppercase text-[#8888aa] mb-2">Ø cardValue / Tag</p>
              <BarChart
                series={data.evPerCardByDay.map((d) => ({ date: d.date, value: d.avgEv }))}
                max={maxOf(data.evPerCardByDay.map((d) => d.avgEv))}
                className="bg-[#ff2ea6]/60 hover:bg-[#ff2ea6]/80"
              />
            </div>
            <div>
              <p className="text-[10px] uppercase text-[#8888aa] mb-2">Abgeschlossene Battles</p>
              <BarChart
                series={data.battlesByDay.map((d) => ({ date: d.date, value: d.battles }))}
                max={maxOf(data.battlesByDay.map((d) => d.battles))}
                className="bg-violet-500/60 hover:bg-violet-500/80"
              />
              <p className="text-[10px] uppercase text-[#8888aa] mb-2 mt-4">Summe Runden</p>
              <BarChart
                series={data.battlesByDay.map((d) => ({ date: d.date, value: d.rounds }))}
                max={maxOf(data.battlesByDay.map((d) => d.rounds))}
                className="bg-pink-500/60 hover:bg-pink-500/80"
              />
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Euro;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="bg-[#100d22] border border-[rgba(255,255,255,0.12)] rounded-xl p-4">
      <Icon className={`w-5 h-5 mb-2 ${accent}`} />
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-[10px] text-[#8888aa] mt-1 leading-tight">{label}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#1e1e55] px-4 py-3">
      <div className="text-lg font-semibold text-white">{value}</div>
      <div className="text-[10px] text-[#8888aa]">{label}</div>
    </div>
  );
}

function ChartCard({
  title,
  icon: Icon,
  children,
  className = '',
}: {
  title: string;
  icon: typeof Euro;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-white/[0.06] bg-[#1e1e55] p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Icon className="w-4 h-4 text-[#E879F9]" />
        {title}
      </h3>
      {children}
    </div>
  );
}