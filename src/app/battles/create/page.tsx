'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Swords, Coins, Users, RotateCcw, Zap, Check, Star, ChevronDown, ChevronUp, ArrowRight, Trophy } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

type Box = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  cardsPerPack: number;
  games: string[];
  featured: boolean;
};

const ROUND_OPTIONS = [3, 5, 7] as const;

const MODE_OPTIONS = [
  {
    value: 'LOWEST_CARD' as const,
    label: 'Modus 1 — Niedrigste Karte',
    description: 'Gewinner erhält die niedrigste Karte des Verlierers',
    icon: '⬇️',
  },
  {
    value: 'HIGHEST_CARD' as const,
    label: 'Modus 2 — Höchste Karte',
    description: 'Gewinner erhält die höchste Karte des Verlierers',
    icon: '⬆️',
  },
  {
    value: 'ALL_CARDS' as const,
    label: 'Modus 3 — Alle Karten',
    description: 'Gewinner erhält alle Karten des Verlierers',
    icon: '🃏',
  },
];

const PLAYER_OPTIONS = [2, 3, 4] as const;

const WIN_CONDITION_OPTIONS = [
  {
    value: 'HIGHEST' as const,
    label: 'Höchster Gesamtwert gewinnt',
    description: 'Der Spieler mit dem höheren Gesamtkartenwert nach allen Runden gewinnt. Wer die stärkeren Karten zieht, hat die besten Chancen.',
    icon: '📈',
  },
  {
    value: 'LOWEST' as const,
    label: 'Niedrigster Gesamtwert gewinnt',
    description: 'Der Spieler mit dem niedrigeren Gesamtkartenwert nach allen Runden gewinnt. Hier ist Glück mit niedrigen Karten der Schlüssel.',
    icon: '📉',
  },
];

const TOTAL_STEPS = 6;

export default function CreateBattlePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [step, setStep] = useState(1);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [rounds, setRounds] = useState<3 | 5 | 7>(3);
  const [battleMode, setBattleMode] = useState<'LOWEST_CARD' | 'HIGHEST_CARD' | 'ALL_CARDS'>('LOWEST_CARD');
  const [winCondition, setWinCondition] = useState<'HIGHEST' | 'LOWEST'>('HIGHEST');
  const [maxParticipants, setMaxParticipants] = useState<2 | 3 | 4>(2);
  const [confirmed, setConfirmed] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdBattleId, setCreatedBattleId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/boxes')
      .then(res => res.json())
      .then(data => {
        if (data.boxes) setBoxes(data.boxes);
      })
      .catch(() => {
        addToast({ title: 'Fehler', description: 'Boxen konnten nicht geladen werden', variant: 'destructive' });
      });
  }, []);

  const entryFee = selectedBox ? selectedBox.price * rounds : 0;

  const handleSubmit = async () => {
    if (!selectedBox || !confirmed) return;
    setLoading(true);

    try {
      const res = await fetch('/api/battles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boxId: selectedBox.id,
          rounds,
          battleMode,
          winCondition,
          maxParticipants,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        addToast({ title: 'Fehler', description: data.error || 'Battle konnte nicht erstellt werden', variant: 'destructive' });
        return;
      }

      setCreatedBattleId(data.battle.id);
      setSuccess(true);
      addToast({ title: 'Battle erstellt!', description: 'Dein Battle wartet auf Mitspieler.' });
    } catch {
      addToast({ title: 'Fehler', description: 'Battle konnte nicht erstellt werden', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (success && createdBattleId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#06061a] via-[#0B0B2B] to-[#06061a] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-6">⚔️</div>
          <h1 className="text-3xl font-bold text-white mb-3">Battle erstellt!</h1>
          <p className="text-[#8888aa] mb-8">
            Dein Battle ist bereit. Warte auf Mitspieler oder teile den Link.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href={`/battles/${createdBattleId}`}
              className="px-6 py-3 bg-[#BFFF00] text-black font-semibold rounded-xl hover:bg-[#d4ff4d] transition-all"
            >
              Zum Battle
            </Link>
            <Link
              href="/battles"
              className="px-6 py-3 text-[#8888aa] hover:text-white transition-colors"
            >
              Zurück zur Übersicht
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-display">
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />
      <div className="fixed inset-0 radial-gradient pointer-events-none" />

      <div className="relative container py-14 sm:py-16 max-w-4xl">
        {/* Header */}
        <div className="mb-10">
          <Link href="/battles" className="inline-flex items-center gap-2 text-[#8888aa] hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Zurück zu Battles
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold">
            <span className="text-white">Neues </span>
            <span className="text-[#BFFF00]">Battle</span>
          </h1>
          <p className="text-[#8888aa] mt-2">Wähle Box, Spieleranzahl, Runden, Belohnungsmodus und Gewinnlogik</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-10">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <button
                onClick={() => { if (s < step) setStep(s); }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  s === step ? 'bg-[#BFFF00] text-black' :
                  s < step ? 'bg-[#BFFF00]/30 text-[#BFFF00] cursor-pointer' :
                  'bg-[#1a1a4a] text-[#8888aa]'
                }`}
              >
                {s < step ? <Check className="w-4 h-4" /> : s}
              </button>
              {s < TOTAL_STEPS && <div className={`w-8 h-0.5 ${s < step ? 'bg-[#BFFF00]/30' : 'bg-[#1a1a4a]'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Box Selection */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Schritt 1: Box wählen</h2>
            {boxes.length === 0 ? (
              <div className="text-center py-12 text-[#8888aa]">Keine Boxen verfügbar</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {boxes.map((box) => (
                  <button
                    key={box.id}
                    onClick={() => { setSelectedBox(box); setStep(2); }}
                    className={`relative text-left p-5 rounded-2xl border transition-all ${
                      selectedBox?.id === box.id
                        ? 'border-[#BFFF00] bg-[#BFFF00]/10 shadow-[0_0_20px_rgba(191,255,0,0.15)]'
                        : 'border-[rgba(255,255,255,0.12)] bg-[#1a1a4a] hover:border-[rgba(255,255,255,0.25)]'
                    }`}
                  >
                    {box.featured && (
                      <div className="absolute top-3 right-3">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      </div>
                    )}
                    {selectedBox?.id === box.id && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-[#BFFF00] rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-black" />
                      </div>
                    )}
                    <img src={box.imageUrl} alt={box.name} className="w-full h-32 object-cover rounded-lg mb-3" />
                    <h3 className="font-semibold text-white text-sm mb-1">{box.name}</h3>
                    <div className="flex items-center justify-between text-xs text-[#8888aa]">
                      <span>{box.cardsPerPack} Karten/Pack</span>
                      <span className="flex items-center gap-1 text-amber-400">
                        <Coins className="w-3 h-3" />
                        {box.price.toFixed(0)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Player Count */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Schritt 2: Spieleranzahl</h2>
            <div className="grid gap-4 sm:grid-cols-3 max-w-lg">
              {PLAYER_OPTIONS.map((count) => (
                <button
                  key={count}
                  onClick={() => setMaxParticipants(count)}
                  className={`p-6 rounded-2xl border text-center transition-all ${
                    maxParticipants === count
                      ? 'border-[#BFFF00] bg-[#BFFF00]/10 shadow-[0_0_20px_rgba(191,255,0,0.15)]'
                      : 'border-[rgba(255,255,255,0.12)] bg-[#1a1a4a] hover:border-[rgba(255,255,255,0.25)]'
                  }`}
                >
                  <Users className={`w-8 h-8 mx-auto mb-3 ${maxParticipants === count ? 'text-[#BFFF00]' : 'text-[#8888aa]'}`} />
                  <div className="text-2xl font-bold text-white">{count}</div>
                  <div className="text-sm text-[#8888aa]">Spieler</div>
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep(1)} className="px-5 py-2.5 text-[#8888aa] hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4 inline mr-1" /> Zurück
              </button>
              <button onClick={() => setStep(3)} className="px-6 py-2.5 bg-[#BFFF00] text-black font-semibold rounded-xl hover:bg-[#d4ff4d] transition-all">
                Weiter <ArrowRight className="w-4 h-4 inline ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Rounds */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Schritt 3: Anzahl der Runden</h2>
            <div className="grid gap-4 sm:grid-cols-3 max-w-lg">
              {ROUND_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRounds(r)}
                  className={`p-6 rounded-2xl border text-center transition-all ${
                    rounds === r
                      ? 'border-[#BFFF00] bg-[#BFFF00]/10 shadow-[0_0_20px_rgba(191,255,0,0.15)]'
                      : 'border-[rgba(255,255,255,0.12)] bg-[#1a1a4a] hover:border-[rgba(255,255,255,0.25)]'
                  }`}
                >
                  <RotateCcw className={`w-8 h-8 mx-auto mb-3 ${rounds === r ? 'text-[#BFFF00]' : 'text-[#8888aa]'}`} />
                  <div className="text-2xl font-bold text-white">{r}</div>
                  <div className="text-sm text-[#8888aa]">Runden</div>
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep(2)} className="px-5 py-2.5 text-[#8888aa] hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4 inline mr-1" /> Zurück
              </button>
              <button onClick={() => setStep(4)} className="px-6 py-2.5 bg-[#BFFF00] text-black font-semibold rounded-xl hover:bg-[#d4ff4d] transition-all">
                Weiter <ArrowRight className="w-4 h-4 inline ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Reward Mode (Belohnungsmodus) */}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Schritt 4: Belohnungsmodus</h2>
            <p className="text-[#8888aa] mb-6 text-sm">
              Der Modus bestimmt, welche Karten der Gewinner vom Verlierer erhält.
            </p>
            <div className="space-y-4 max-w-lg">
              {MODE_OPTIONS.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => setBattleMode(mode.value)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all ${
                    battleMode === mode.value
                      ? 'border-[#BFFF00] bg-[#BFFF00]/10 shadow-[0_0_20px_rgba(191,255,0,0.15)]'
                      : 'border-[rgba(255,255,255,0.12)] bg-[#1a1a4a] hover:border-[rgba(255,255,255,0.25)]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{mode.icon}</span>
                    <div>
                      <div className="font-semibold text-white">{mode.label}</div>
                      <div className="text-sm text-[#8888aa]">{mode.description}</div>
                    </div>
                    {battleMode === mode.value && (
                      <div className="ml-auto w-6 h-6 bg-[#BFFF00] rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-black" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep(3)} className="px-5 py-2.5 text-[#8888aa] hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4 inline mr-1" /> Zurück
              </button>
              <button onClick={() => setStep(5)} className="px-6 py-2.5 bg-[#BFFF00] text-black font-semibold rounded-xl hover:bg-[#d4ff4d] transition-all">
                Weiter <ArrowRight className="w-4 h-4 inline ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Win Condition (Gewinnlogik) */}
        {step === 5 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Schritt 5: Gewinnlogik</h2>
            <p className="text-[#8888aa] mb-6 text-sm">
              Lege fest, wie der Gewinner des Battles bestimmt wird. Der Gewinner wird anhand des Gesamtwerts aller Karten nach allen Runden ermittelt.
            </p>
            <div className="space-y-4 max-w-lg">
              {WIN_CONDITION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setWinCondition(option.value)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all ${
                    winCondition === option.value
                      ? 'border-[#BFFF00] bg-[#BFFF00]/10 shadow-[0_0_20px_rgba(191,255,0,0.15)]'
                      : 'border-[rgba(255,255,255,0.12)] bg-[#1a1a4a] hover:border-[rgba(255,255,255,0.25)]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{option.icon}</span>
                    <div>
                      <div className="font-semibold text-white">{option.label}</div>
                      <div className="text-sm text-[#8888aa]">{option.description}</div>
                    </div>
                    {winCondition === option.value && (
                      <div className="ml-auto shrink-0 w-6 h-6 bg-[#BFFF00] rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-black" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep(4)} className="px-5 py-2.5 text-[#8888aa] hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4 inline mr-1" /> Zurück
              </button>
              <button onClick={() => setStep(6)} className="px-6 py-2.5 bg-[#BFFF00] text-black font-semibold rounded-xl hover:bg-[#d4ff4d] transition-all">
                Weiter <ArrowRight className="w-4 h-4 inline ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Summary */}
        {step === 6 && selectedBox && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Zusammenfassung</h2>
            <div className="bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] rounded-2xl p-6 space-y-4 max-w-lg">
              <div className="flex justify-between items-center">
                <span className="text-[#8888aa]">Box</span>
                <span className="text-white font-medium">{selectedBox.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8888aa]">Spieler</span>
                <span className="text-white font-medium">{maxParticipants}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8888aa]">Runden</span>
                <span className="text-white font-medium">{rounds}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8888aa]">Belohnungsmodus</span>
                <span className="text-white font-medium">{MODE_OPTIONS.find(m => m.value === battleMode)?.label}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8888aa]">Gewinnlogik</span>
                <span className="text-white font-medium">{WIN_CONDITION_OPTIONS.find(w => w.value === winCondition)?.label}</span>
              </div>
              <div className="border-t border-[rgba(255,255,255,0.1)] pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-[#8888aa]">Teilnahmegebühr</span>
                  <span className="text-amber-400 font-bold text-lg flex items-center gap-1">
                    <Coins className="w-4 h-4" />
                    {entryFee.toFixed(0)} Coins
                  </span>
                </div>
                <p className="text-xs text-[#666688] mt-1">
                  ({selectedBox.price.toFixed(0)} × {rounds} Runden)
                </p>
              </div>
              <div className="border-t border-[rgba(255,255,255,0.1)] pt-4">
                <p className="text-xs text-amber-400/80 mb-2 font-medium">
                  Gewinner wird anhand des Gesamtwerts aller Karten nach allen Runden bestimmt.
                </p>
                <p className="text-xs text-[#8888aa] mb-3">
                  Die Lobby ist 15 Minuten offen. Tritt kein Mitspieler bei, wird das Battle storniert und die Gebühr erstattet. Nach Beitritt aller Spieler startet das Battle automatisch nach 3 Minuten.
                </p>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded accent-[#BFFF00]"
                  />
                  <span className="text-sm text-[#f0f0f5]">
                    Ich bestätige die Einstellungen und die Teilnahmegebühr von {entryFee.toFixed(0)} Coins.
                  </span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep(5)} className="px-5 py-2.5 text-[#8888aa] hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4 inline mr-1" /> Zurück
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !confirmed}
                className="px-8 py-3 bg-[#BFFF00] text-black font-semibold rounded-xl hover:bg-[#d4ff4d] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Erstelle...</>
                ) : (
                  <><Zap className="w-5 h-5" /> Battle erstellen</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
