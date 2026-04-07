'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Coins, Users, Zap, Check, Star, Search, Eye, EyeOff, Swords } from 'lucide-react';
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

const PLAYER_OPTIONS = [
  { value: 2 as const, label: '1 vs 1', sub: '2 Spieler' },
  { value: 3 as const, label: '1v1v1', sub: '3 Spieler' },
  { value: 4 as const, label: '1v1v1v1', sub: '4 Spieler' },
];

const ROUND_OPTIONS = [3, 5, 7] as const;

const MODE_OPTIONS = [
  { value: 'LOWEST_CARD' as const, label: 'Niedrigste Karte', description: 'Gewinner erhält die niedrigste Karte des Verlierers', icon: '⬇️' },
  { value: 'HIGHEST_CARD' as const, label: 'Höchste Karte', description: 'Gewinner erhält die höchste Karte des Verlierers', icon: '⬆️' },
  { value: 'ALL_CARDS' as const, label: 'Alle Karten', description: 'Gewinner erhält alle Karten des Verlierers', icon: '🃏' },
];

const WIN_CONDITION_OPTIONS = [
  { value: 'HIGHEST' as const, label: 'Höchster Wert', description: 'Höchster Gesamtkartenwert gewinnt', icon: '📈' },
  { value: 'LOWEST' as const, label: 'Niedrigster Wert', description: 'Niedrigster Gesamtkartenwert gewinnt', icon: '📉' },
  { value: 'SHARE_MODE' as const, label: 'Teilen', description: 'Karten werden gleichmäßig aufgeteilt', icon: '🤝' },
  { value: 'JACKPOT' as const, label: 'Jackpot', description: 'Gewichteter Zufall — ein Spieler gewinnt alles', icon: '🎰' },
];

export default function CreateBattlePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [boxSearch, setBoxSearch] = useState('');
  const [boxSort, setBoxSort] = useState<'price-asc' | 'price-desc' | 'name'>('price-asc');
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [rounds, setRounds] = useState<3 | 5 | 7>(3);
  const [battleMode, setBattleMode] = useState<'LOWEST_CARD' | 'HIGHEST_CARD' | 'ALL_CARDS'>('LOWEST_CARD');
  const [winCondition, setWinCondition] = useState<'HIGHEST' | 'LOWEST' | 'SHARE_MODE' | 'JACKPOT'>('HIGHEST');
  const [maxParticipants, setMaxParticipants] = useState<2 | 3 | 4>(2);
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [success, setSuccess] = useState(false);
  const [createdBattleId, setCreatedBattleId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/boxes')
      .then(res => res.json())
      .then(data => { if (data.boxes) setBoxes(data.boxes); })
      .catch(() => addToast({ title: 'Fehler', description: 'Boxen konnten nicht geladen werden', variant: 'destructive' }));
  }, []);

  const filteredBoxes = useMemo(() => {
    let result = boxes;
    if (boxSearch.trim()) {
      const q = boxSearch.toLowerCase();
      result = result.filter(b => b.name.toLowerCase().includes(q));
    }
    result = [...result].sort((a, b) => {
      if (boxSort === 'price-asc') return a.price - b.price;
      if (boxSort === 'price-desc') return b.price - a.price;
      return a.name.localeCompare(b.name);
    });
    return result;
  }, [boxes, boxSearch, boxSort]);

  const entryFee = selectedBox ? selectedBox.price * rounds : 0;
  const canCreate = !!selectedBox;

  const handleSubmit = async () => {
    if (!selectedBox) return;
    setLoading(true);
    try {
      const res = await fetch('/api/battles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boxId: selectedBox.id, rounds, battleMode, winCondition, maxParticipants, privacy }),
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
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#C84FFF]/10 border border-[#C84FFF]/30 flex items-center justify-center">
            <Swords className="w-10 h-10 text-[#C84FFF]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Battle erstellt!</h1>
          <p className="text-[#8888aa] mb-8">Dein Battle ist bereit. Warte auf Mitspieler oder teile den Link.</p>
          {privacy === 'PRIVATE' && (
            <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-400 font-medium mb-1">Privates Battle</p>
              <p className="text-xs text-[#8888aa]">Teile den Link, damit andere beitreten können.</p>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <Link href={`/battles/${createdBattleId}`} className="px-6 py-3 bg-[#C84FFF] text-white font-semibold rounded-xl hover:bg-[#E879F9] transition-all">
              Zum Battle
            </Link>
            <Link href="/battles" className="px-6 py-3 text-[#8888aa] hover:text-white transition-colors">
              Zurück zur Übersicht
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedStyle = 'border-[#C84FFF] bg-[#C84FFF]/10 shadow-[0_0_20px_rgba(200,79,255,0.12)]';
  const unselectedStyle = 'border-[rgba(255,255,255,0.08)] bg-[#12123a] hover:border-[rgba(255,255,255,0.2)]';

  return (
    <div className="min-h-screen font-display">
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />
      <div className="fixed inset-0 radial-gradient pointer-events-none" />

      <div className="relative container py-10 sm:py-14 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/battles" className="inline-flex items-center gap-2 text-[#8888aa] hover:text-white mb-4 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Zurück zu Battles
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold">
            <span className="text-white">Neues </span>
            <span className="text-[#C84FFF]">Battle</span>
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Left: Form Sections ── */}
          <div className="flex-1 space-y-8 min-w-0">

            {/* Players */}
            <section>
              <h2 className="text-sm font-semibold text-[#8888aa] uppercase tracking-wider mb-3">Spieler</h2>
              <div className="flex gap-3">
                {PLAYER_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setMaxParticipants(opt.value)}
                    className={`flex-1 py-3 px-4 rounded-xl border text-center transition-all ${maxParticipants === opt.value ? selectedStyle : unselectedStyle}`}
                  >
                    <div className={`text-lg font-bold ${maxParticipants === opt.value ? 'text-white' : 'text-[#8888aa]'}`}>{opt.label}</div>
                    <div className="text-xs text-[#666688] mt-0.5">{opt.sub}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* Box Selection */}
            <section>
              <h2 className="text-sm font-semibold text-[#8888aa] uppercase tracking-wider mb-3">Box wählen</h2>
              <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666688]" />
                  <input
                    type="text"
                    placeholder="Box suchen..."
                    value={boxSearch}
                    onChange={e => setBoxSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#12123a] border border-[rgba(255,255,255,0.08)] text-sm text-white placeholder-[#666688] focus:border-[#C84FFF]/40 focus:outline-none transition-colors"
                  />
                </div>
                <select
                  value={boxSort}
                  onChange={e => setBoxSort(e.target.value as typeof boxSort)}
                  className="px-3 py-2.5 rounded-xl bg-[#12123a] border border-[rgba(255,255,255,0.08)] text-sm text-[#8888aa] focus:border-[#C84FFF]/40 focus:outline-none"
                >
                  <option value="price-asc">Preis ↑</option>
                  <option value="price-desc">Preis ↓</option>
                  <option value="name">Name</option>
                </select>
              </div>
              {filteredBoxes.length === 0 ? (
                <div className="text-center py-10 text-[#666688] text-sm">Keine Boxen gefunden</div>
              ) : (
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                  {filteredBoxes.map(box => (
                    <button
                      key={box.id}
                      onClick={() => setSelectedBox(box)}
                      className={`relative text-left rounded-xl border overflow-hidden transition-all group ${
                        selectedBox?.id === box.id ? selectedStyle : unselectedStyle
                      }`}
                    >
                      {selectedBox?.id === box.id && (
                        <div className="absolute top-2 right-2 z-10 w-5 h-5 bg-[#C84FFF] rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-black" />
                        </div>
                      )}
                      {box.featured && !selectedBox?.id && (
                        <div className="absolute top-2 right-2 z-10">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        </div>
                      )}
                      <div className="aspect-[4/3] overflow-hidden">
                        <img src={box.imageUrl} alt={box.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-white text-sm leading-tight line-clamp-1">{box.name}</h3>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-xs text-[#666688]">{box.cardsPerPack} Karten</span>
                          <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                            <Coins className="w-3 h-3" />{box.price.toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Rounds */}
            <section>
              <h2 className="text-sm font-semibold text-[#8888aa] uppercase tracking-wider mb-3">Runden</h2>
              <div className="flex gap-3">
                {ROUND_OPTIONS.map(r => (
                  <button
                    key={r}
                    onClick={() => setRounds(r)}
                    className={`flex-1 py-3 rounded-xl border text-center transition-all ${rounds === r ? selectedStyle : unselectedStyle}`}
                  >
                    <div className={`text-xl font-bold ${rounds === r ? 'text-white' : 'text-[#8888aa]'}`}>{r}</div>
                    <div className="text-xs text-[#666688]">Runden</div>
                  </button>
                ))}
              </div>
            </section>

            {/* Win Condition + Reward Mode side by side */}
            <div className="grid gap-8 md:grid-cols-2">
              {/* Win Condition */}
              <section>
                <h2 className="text-sm font-semibold text-[#8888aa] uppercase tracking-wider mb-3">Gewinnlogik</h2>
                <div className="space-y-2">
                  {WIN_CONDITION_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setWinCondition(opt.value)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${winCondition === opt.value ? selectedStyle : unselectedStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{opt.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold text-sm ${winCondition === opt.value ? 'text-white' : 'text-[#8888aa]'}`}>{opt.label}</div>
                          <div className="text-xs text-[#666688] mt-0.5">{opt.description}</div>
                        </div>
                        {winCondition === opt.value && (
                          <div className="shrink-0 w-5 h-5 bg-[#C84FFF] rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-black" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Reward Mode */}
              <section>
                <h2 className="text-sm font-semibold text-[#8888aa] uppercase tracking-wider mb-3">Belohnungsmodus</h2>
                <div className="space-y-2">
                  {MODE_OPTIONS.map(mode => (
                    <button
                      key={mode.value}
                      onClick={() => setBattleMode(mode.value)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${battleMode === mode.value ? selectedStyle : unselectedStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{mode.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold text-sm ${battleMode === mode.value ? 'text-white' : 'text-[#8888aa]'}`}>{mode.label}</div>
                          <div className="text-xs text-[#666688] mt-0.5">{mode.description}</div>
                        </div>
                        {battleMode === mode.value && (
                          <div className="shrink-0 w-5 h-5 bg-[#C84FFF] rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-black" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            {/* Privacy */}
            <section>
              <h2 className="text-sm font-semibold text-[#8888aa] uppercase tracking-wider mb-3">Sichtbarkeit</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setPrivacy('PUBLIC')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all ${privacy === 'PUBLIC' ? selectedStyle : unselectedStyle}`}
                >
                  <Eye className={`w-4 h-4 ${privacy === 'PUBLIC' ? 'text-[#C84FFF]' : 'text-[#666688]'}`} />
                  <span className={`font-semibold text-sm ${privacy === 'PUBLIC' ? 'text-white' : 'text-[#8888aa]'}`}>Öffentlich</span>
                </button>
                <button
                  onClick={() => setPrivacy('PRIVATE')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all ${privacy === 'PRIVATE' ? selectedStyle : unselectedStyle}`}
                >
                  <EyeOff className={`w-4 h-4 ${privacy === 'PRIVATE' ? 'text-[#C84FFF]' : 'text-[#666688]'}`} />
                  <span className={`font-semibold text-sm ${privacy === 'PRIVATE' ? 'text-white' : 'text-[#8888aa]'}`}>Privat</span>
                </button>
              </div>
              {privacy === 'PRIVATE' && (
                <p className="text-xs text-[#666688] mt-2">Nur über direkten Link erreichbar.</p>
              )}
            </section>
          </div>

          {/* ── Right: Sticky Summary Panel ── */}
          <div className="lg:w-80 shrink-0">
            <div className="lg:sticky lg:top-24">
              <div className="bg-[#1a1a4a] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-[#8888aa] uppercase tracking-wider mb-4">Zusammenfassung</h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#666688]">Spieler</span>
                    <span className="text-white font-medium">{PLAYER_OPTIONS.find(p => p.value === maxParticipants)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666688]">Box</span>
                    <span className={`font-medium truncate ml-4 ${selectedBox ? 'text-white' : 'text-[#444466]'}`}>
                      {selectedBox?.name || 'Nicht gewählt'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666688]">Runden</span>
                    <span className="text-white font-medium">{rounds}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666688]">Gewinnlogik</span>
                    <span className="text-white font-medium">{WIN_CONDITION_OPTIONS.find(w => w.value === winCondition)?.icon} {WIN_CONDITION_OPTIONS.find(w => w.value === winCondition)?.label.split(' ')[0]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666688]">Belohnung</span>
                    <span className="text-white font-medium">{MODE_OPTIONS.find(m => m.value === battleMode)?.icon} {MODE_OPTIONS.find(m => m.value === battleMode)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666688]">Sichtbarkeit</span>
                    <span className="text-white font-medium">{privacy === 'PUBLIC' ? 'Öffentlich' : 'Privat'}</span>
                  </div>
                </div>

                <div className="border-t border-[rgba(255,255,255,0.08)] mt-4 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[#666688] text-sm">Einsatz</span>
                    <span className="text-amber-400 font-bold text-lg flex items-center gap-1">
                      <Coins className="w-4 h-4" />
                      {entryFee.toFixed(0)}
                    </span>
                  </div>
                  {selectedBox && (
                    <p className="text-xs text-[#444466] mt-1 text-right">
                      {selectedBox.price.toFixed(0)} x {rounds} Runden
                    </p>
                  )}
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading || !canCreate}
                  className="w-full mt-5 px-6 py-3.5 bg-[#C84FFF] text-white font-semibold rounded-xl hover:bg-[#E879F9] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Erstelle...</>
                  ) : (
                    <><Zap className="w-5 h-5" /> Battle erstellen</>
                  )}
                </button>

                <p className="text-[10px] text-[#444466] mt-3 leading-relaxed text-center">
                  Lobby 15 Min offen. Kein Gegner = Erstattung. Auto-Start 3 Min nach vollem Lobby.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile sticky bottom bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0B2B]/95 backdrop-blur-lg border-t border-[rgba(255,255,255,0.08)] px-4 py-3">
          <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
            <div>
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                <Coins className="w-4 h-4" />
                <span>{entryFee.toFixed(0)} Coins</span>
              </div>
              <p className="text-xs text-[#666688]">{selectedBox?.name || 'Box wählen'}</p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading || !canCreate}
              className="px-6 py-2.5 bg-[#C84FFF] text-white font-semibold rounded-xl hover:bg-[#E879F9] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Zap className="w-4 h-4" /> Erstellen</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
