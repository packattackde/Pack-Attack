'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Coins, Zap, Check, Star, Search, Eye, EyeOff, Plus, X, Package } from 'lucide-react';
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

const MODE_OPTIONS = [
  { value: 'LOWEST_CARD' as const, label: 'Niedrigste Karte', description: 'Gewinner erhält die niedrigste Karte des Verlierers', icon: '⬇️' },
  { value: 'HIGHEST_CARD' as const, label: 'Höchste Karte', description: 'Gewinner erhält die höchste Karte des Verlierers', icon: '⬆️' },
];

const WIN_CONDITION_OPTIONS = [
  { value: 'HIGHEST' as const, label: 'Höchster Wert', description: 'Höchster Gesamtkartenwert gewinnt', icon: '📈' },
  { value: 'LOWEST' as const, label: 'Niedrigster Wert', description: 'Niedrigster Gesamtkartenwert gewinnt', icon: '📉' },
  { value: 'SHARE_MODE' as const, label: 'Teilen', description: 'Karten werden gleichmäßig aufgeteilt', icon: '🤝' },
];

export default function CreateBattlePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [boxSearch, setBoxSearch] = useState('');
  const [boxSort, setBoxSort] = useState<'price-asc' | 'price-desc' | 'name'>('price-asc');
  const [pickedBoxes, setPickedBoxes] = useState<Box[]>([]);
  const [battleMode, setBattleMode] = useState<'LOWEST_CARD' | 'HIGHEST_CARD'>('LOWEST_CARD');
  const [winCondition, setWinCondition] = useState<'HIGHEST' | 'LOWEST' | 'SHARE_MODE'>('HIGHEST');
  const [maxParticipants, setMaxParticipants] = useState<2 | 3 | 4>(2);
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');

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

  const rounds = pickedBoxes.length;
  const entryFee = pickedBoxes.reduce((sum, b) => sum + b.price, 0);
  const canCreate = rounds >= 1 && rounds <= 10;

  const addBox = (box: Box) => {
    if (pickedBoxes.length >= 10) {
      addToast({ title: 'Maximum erreicht', description: 'Maximal 10 Runden möglich', variant: 'destructive' });
      return;
    }
    setPickedBoxes(prev => [...prev, box]);
  };

  const removeBox = (index: number) => {
    setPickedBoxes(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!canCreate) return;
    setLoading(true);
    try {
      const res = await fetch('/api/battles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boxIds: pickedBoxes.map(b => b.id),
          battleMode,
          winCondition,
          maxParticipants,
          privacy,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast({ title: 'Fehler', description: data.error || 'Battle konnte nicht erstellt werden', variant: 'destructive' });
        return;
      }
      addToast({ title: 'Battle erstellt!', description: 'Du wirst zur Lobby weitergeleitet...' });
      router.push(`/battles/${data.battle.id}`);
    } catch {
      addToast({ title: 'Fehler', description: 'Battle konnte nicht erstellt werden', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const selectedStyle = 'border-[#C84FFF] bg-[#C84FFF]/10 shadow-[0_0_20px_rgba(200,79,255,0.12)]';
  const unselectedStyle = 'border-[rgba(255,255,255,0.08)] bg-[#12123a] hover:border-[rgba(255,255,255,0.2)]';

  return (
    <div className="min-h-screen font-display">
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />
      <div className="fixed inset-0 radial-gradient pointer-events-none" />

      <div className="relative container py-10 sm:py-14 max-w-7xl">
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

            {/* Picked Boxes (Round Lineup) */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[#8888aa] uppercase tracking-wider">
                  Deine Runden <span className="text-[#C84FFF]">({rounds}/10)</span>
                </h2>
                {rounds > 0 && (
                  <button onClick={() => setPickedBoxes([])} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">
                    Alle entfernen
                  </button>
                )}
              </div>

              {rounds === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-[rgba(255,255,255,0.08)] p-8 text-center">
                  <Package className="w-8 h-8 text-[#444466] mx-auto mb-2" />
                  <p className="text-sm text-[#666688]">Wähle unten Boxen aus — jede Box = 1 Runde</p>
                  <p className="text-xs text-[#444466] mt-1">Du kannst die gleiche Box mehrfach hinzufügen</p>
                </div>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {pickedBoxes.map((box, i) => (
                    <div
                      key={`pick-${i}`}
                      className="group relative flex items-center gap-2 pl-2 pr-1 py-1.5 rounded-lg bg-[#1a1a4a] border border-[rgba(255,255,255,0.1)] hover:border-[#C84FFF]/30 transition-all"
                    >
                      <div className="w-8 h-8 rounded-md overflow-hidden shrink-0 bg-[#12123a]">
                        <img src={box.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-white font-medium truncate max-w-[100px]">{box.name}</div>
                        <div className="flex items-center gap-1 text-[10px] text-amber-400">
                          <Coins className="w-2.5 h-2.5" />{box.price.toFixed(0)}
                        </div>
                      </div>
                      <span className="text-[9px] text-[#444466] font-mono ml-1 mr-1">R{i + 1}</span>
                      <button
                        onClick={() => removeBox(i)}
                        className="w-5 h-5 rounded-full bg-red-500/10 hover:bg-red-500/30 flex items-center justify-center transition-colors shrink-0"
                      >
                        <X className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  ))}
                  {rounds < 10 && (
                    <div className="flex items-center justify-center w-10 h-[52px] rounded-lg border-2 border-dashed border-[rgba(255,255,255,0.08)] text-[#444466]">
                      <Plus className="w-4 h-4" />
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Box Catalog */}
            <section>
              <h2 className="text-sm font-semibold text-[#8888aa] uppercase tracking-wider mb-3">Box hinzufügen</h2>
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
                  {filteredBoxes.map(box => {
                    const pickCount = pickedBoxes.filter(b => b.id === box.id).length;
                    return (
                      <button
                        key={box.id}
                        onClick={() => addBox(box)}
                        disabled={rounds >= 10}
                        className={`relative text-left rounded-xl border overflow-hidden transition-all group ${
                          pickCount > 0 ? selectedStyle : unselectedStyle
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        {pickCount > 0 && (
                          <div className="absolute top-2 right-2 z-10 min-w-[20px] h-5 px-1 bg-[#C84FFF] rounded-full flex items-center justify-center">
                            <span className="text-[10px] font-bold text-black">{pickCount}x</span>
                          </div>
                        )}
                        {box.featured && pickCount === 0 && (
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
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all pointer-events-none">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#C84FFF] rounded-full p-2">
                            <Plus className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Win Condition + Reward Mode */}
            <div className="grid gap-8 md:grid-cols-2">
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

          {/* Sticky Summary Panel */}
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
                    <span className="text-[#666688]">Runden</span>
                    <span className={`font-medium ${rounds > 0 ? 'text-white' : 'text-[#444466]'}`}>{rounds || '—'}</span>
                  </div>
                  {rounds > 0 && (
                    <div>
                      <span className="text-[#666688] text-xs">Boxen:</span>
                      <div className="mt-1.5 space-y-1">
                        {(() => {
                          const grouped = pickedBoxes.reduce((acc, box) => {
                            acc.set(box.id, (acc.get(box.id) || { box, count: 0 }));
                            acc.get(box.id)!.count++;
                            return acc;
                          }, new Map<string, { box: Box; count: number }>());
                          return [...grouped.values()].map(({ box, count }) => (
                            <div key={box.id} className="flex items-center justify-between text-xs">
                              <span className="text-white truncate max-w-[140px]">{count > 1 ? `${count}x ` : ''}{box.name}</span>
                              <span className="text-amber-400 font-medium">{(box.price * count).toFixed(0)}</span>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
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
                      {Math.round(entryFee)}
                    </span>
                  </div>
                  {rounds > 0 && (
                    <p className="text-xs text-[#444466] mt-1 text-right">
                      {rounds} {rounds === 1 ? 'Runde' : 'Runden'} · {new Set(pickedBoxes.map(b => b.id)).size} {new Set(pickedBoxes.map(b => b.id)).size === 1 ? 'Box' : 'Boxen'}
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
                <span>{Math.round(entryFee)} Coins</span>
              </div>
              <p className="text-xs text-[#666688]">{rounds} {rounds === 1 ? 'Runde' : 'Runden'}</p>
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
