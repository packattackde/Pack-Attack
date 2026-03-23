'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Coins, Trophy, Swords, Users, ArrowLeft, Sparkles, Crown, Zap, Package, Check, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { AddBotsControl } from '../components/AddBotsControl';

interface BattleDrawClientProps {
  battle: any;
  currentUserId: string | null;
  isAdmin: boolean;
}

interface PullResult {
  participantId: string;
  participantName: string;
  isBot: boolean;
  card: any;
  coinValue: number;
  roundNumber: number;
}

interface RoundResult {
  roundNumber: number;
  pulls: PullResult[];
  winnerId: string;
  winnerName: string;
  winningCard: any;
  winningValue: number;
}

export default function BattleDrawClient({ battle: initialBattle, currentUserId, isAdmin }: BattleDrawClientProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [battle, setBattle] = useState(initialBattle);
  const [starting, setStarting] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [allPulls, setAllPulls] = useState<PullResult[]>([]);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [participantTotals, setParticipantTotals] = useState<Map<string, number>>(new Map());
  const [currentReveal, setCurrentReveal] = useState<PullResult | null>(null);
  const [isShowingReveal, setIsShowingReveal] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [battleComplete, setBattleComplete] = useState(false);
  const [showingRoundWinner, setShowingRoundWinner] = useState<RoundResult | null>(null);
  const [joining, setJoining] = useState(false);
  const [readyLoading, setReadyLoading] = useState(false);
  const [timeUntilAutoStart, setTimeUntilAutoStart] = useState<number | null>(null);
  
  // SIMPLE ANIMATION STATE - one flag to rule them all
  const [animationPlayed, setAnimationPlayed] = useState(false);
  
  const revealTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const battleIdRef = useRef(initialBattle.id);
  
  const REVEAL_DURATION = 2000;
  const ROUND_WINNER_DURATION = 1500;
  const BETWEEN_PULLS_DELAY = 300;
  const POLL_INTERVAL = 500;

  const isCreator = currentUserId === battle.creatorId;
  const isParticipant = battle.participants.some((p: any) => p.userId === currentUserId);
  const myParticipant = battle.participants.find((p: any) => p.userId === currentUserId);
  const amIReady = myParticipant?.isReady ?? false;
  const isBattleFull = battle.participants.length >= battle.maxParticipants;
  const allParticipantsReady = isBattleFull && battle.participants.every((p: any) => p.isReady || p.user?.isBot);
  const humanParticipantsReady = isBattleFull && battle.participants.filter((p: any) => !p.user?.isBot).every((p: any) => p.isReady);
  
  const canJoinBattle = currentUserId && 
                        !isParticipant && 
                        battle.status === 'WAITING' && 
                        battle.participants.length < battle.maxParticipants;
  const canStartBattle = (isCreator || isAdmin) && 
                        battle.status === 'WAITING' && 
                        isBattleFull &&
                        humanParticipantsReady;
  
  // Filter out bots from participants for non-admin users
  const visibleParticipants = isAdmin 
    ? battle.participants 
    : battle.participants.filter((p: any) => !p.user?.isBot);

  const clearRevealTimeouts = useCallback(() => {
    revealTimeoutsRef.current.forEach(clearTimeout);
    revealTimeoutsRef.current = [];
  }, []);

  const scheduleTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = setTimeout(callback, delay);
    revealTimeoutsRef.current.push(timeoutId);
    return timeoutId;
  }, []);

  // Helper to check if animation was seen in sessionStorage
  const wasAnimationSeen = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(`battle_seen_${battleIdRef.current}`) === 'true';
  }, []);

  const markAnimationAsSeen = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`battle_seen_${battleIdRef.current}`, 'true');
    }
  }, []);

  const autoStartTriggeredRef = useRef(false);

  // Calculate time until auto-start and trigger it when countdown expires
  useEffect(() => {
    if (battle.status !== 'WAITING' || !isBattleFull) {
      setTimeUntilAutoStart(null);
      return;
    }

    const fullAt = battle.fullAt ? new Date(battle.fullAt) : new Date(battle.createdAt);
    const autoStartAt = new Date(fullAt.getTime() + 5 * 60 * 1000);

    const updateCountdown = () => {
      const now = new Date();
      const msRemaining = autoStartAt.getTime() - now.getTime();

      if (msRemaining <= 0) {
        setTimeUntilAutoStart(0);
        triggerAutoStart();
      } else {
        setTimeUntilAutoStart(Math.floor(msRemaining / 1000));
      }
    };

    const triggerAutoStart = async () => {
      if (autoStartTriggeredRef.current || animationPlayed || isDrawing) return;
      autoStartTriggeredRef.current = true;

      console.log('[AUTO-START] Countdown expired, triggering auto-start...');
      try {
        const res = await fetch(`/api/battles/${battle.id}/auto-start`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          console.log('[AUTO-START] Server confirmed battle started');
        } else if (data.error === 'Battle already started or finished') {
          console.log('[AUTO-START] Battle already started by someone else');
        } else {
          console.warn('[AUTO-START] Server response:', data);
          autoStartTriggeredRef.current = false;
        }
      } catch (err) {
        console.error('[AUTO-START] Failed to trigger:', err);
        autoStartTriggeredRef.current = false;
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [battle.status, battle.fullAt, battle.createdAt, battle.id, isBattleFull, animationPlayed, isDrawing]);

  // Format countdown time
  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return 'Auto-starting soon...';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize totals - only on mount, not on battle updates
  useEffect(() => {
    const initialTotals = new Map<string, number>();
    initialBattle.participants.forEach((p: any) => {
      initialTotals.set(p.userId, 0);
    });
    setParticipantTotals(initialTotals);
    
    // Only clear timeouts on unmount, not on every participant change
    return () => {
      clearRevealTimeouts();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // THE ANIMATION FUNCTION - extracted and stable
  const runAnimation = useCallback((battleData: any) => {
    console.log('[ANIM] Starting animation with', battleData.pulls?.length, 'pulls');
    
    // Clear any existing timeouts
    clearRevealTimeouts();
    
    // Set animation state
    setIsDrawing(true);
    setAllPulls([]);
    setRoundResults([]);
    
    // Reset totals to 0
    const initialTotals = new Map<string, number>();
    battleData.participants.forEach((p: any) => {
      initialTotals.set(p.userId, 0);
    });
    setParticipantTotals(initialTotals);
    
    const pullsByRound = prepareDrawData(battleData);
    const isUpsideDown = battleData.battleMode === 'UPSIDE_DOWN';
    
    let timeline = 500;
    
    // Process each round
    for (let round = 1; round <= battleData.rounds; round++) {
      const roundPulls = pullsByRound.get(round) || [];
      
      // Reveal each pull in the round
      roundPulls.forEach((pull, index) => {
        scheduleTimeout(() => {
          setCurrentReveal(pull);
          setIsShowingReveal(true);
          setAllPulls(prev => [...prev, pull]);
          setCurrentRound(round);
          
          // Update total for this participant when card is revealed
          setParticipantTotals(prev => {
            const newTotals = new Map(prev);
            const currentTotal = newTotals.get(pull.participantId) || 0;
            newTotals.set(pull.participantId, currentTotal + pull.coinValue);
            return newTotals;
          });
        }, timeline);
        
        timeline += REVEAL_DURATION;
        
        scheduleTimeout(() => {
          setIsShowingReveal(false);
          setCurrentReveal(null);
        }, timeline);
        
        timeline += BETWEEN_PULLS_DELAY;
      });
      
      // Show round winner after all pulls in round
      const roundResult = determineRoundWinner(roundPulls, isUpsideDown);
      
      scheduleTimeout(() => {
        setRoundResults(prev => [...prev, roundResult]);
        setShowingRoundWinner(roundResult);
      }, timeline);
      
      timeline += ROUND_WINNER_DURATION;
      
      scheduleTimeout(() => {
        setShowingRoundWinner(null);
      }, timeline);
      
      timeline += 500;
    }
    
    // Battle complete
    scheduleTimeout(() => {
      setWinner(battleData.isDraw ? null : battleData.winnerId);
      setBattleComplete(true);
      setBattle(battleData);
      setIsDrawing(false);
      
      console.log('[ANIM] Animation complete!');
      
      if (battleData.isDraw) {
        addToast({
          title: "It's a Draw! ⚖️",
          description: 'All players had the same total value — everyone keeps their cards.',
        });
      } else {
        addToast({
          title: 'Battle Complete! 🏆',
          description: `Winner: ${battleData.winner?.name || battleData.winner?.email}`,
        });
      }
    }, timeline);
  }, [clearRevealTimeouts, scheduleTimeout, addToast]);

  const prepareDrawData = (battleData: any) => {
    const pullsByRound: Map<number, PullResult[]> = new Map();
    
    // Group pulls by round
    for (let round = 1; round <= battleData.rounds; round++) {
      const roundPulls: PullResult[] = [];
      
      for (const participant of battleData.participants) {
        const pullData = battleData.pulls?.find((p: any) => 
          p.participant.userId === participant.userId && 
          p.roundNumber === round
        );
        
        if (pullData) {
          roundPulls.push({
            participantId: participant.userId,
            participantName: participant.user?.name || participant.user?.email || 'Unknown',
            isBot: participant.user?.isBot || false,
            card: pullData.pull?.card || null,
            coinValue: pullData.coinValue || 0,
            roundNumber: round,
          });
        }
      }
      
      pullsByRound.set(round, roundPulls);
    }
    
    return pullsByRound;
  };

  const determineRoundWinner = (roundPulls: PullResult[], isUpsideDown: boolean): RoundResult => {
    let winner = roundPulls[0];
    
    for (const pull of roundPulls) {
      if (isUpsideDown) {
        // Lowest value wins
        if (pull.coinValue < winner.coinValue) {
          winner = pull;
        }
      } else {
        // Highest value wins
        if (pull.coinValue > winner.coinValue) {
          winner = pull;
        }
      }
    }
    
    return {
      roundNumber: roundPulls[0]?.roundNumber || 0,
      pulls: roundPulls,
      winnerId: winner.participantId,
      winnerName: winner.participantName,
      winningCard: winner.card,
      winningValue: winner.coinValue,
    };
  };

  // MAIN EFFECT: Handle animation triggering on mount and via polling
  useEffect(() => {
    const battleId = battleIdRef.current;
    
    // Function to check and trigger animation
    const checkAndAnimate = (battleData: any, source: string) => {
      const hasPulls = battleData.pulls?.length > 0;
      const isActive = battleData.status === 'IN_PROGRESS' || battleData.status === 'FINISHED';
      
      console.log(`[${source}] Checking - hasPulls:${hasPulls} status:${battleData.status} animationPlayed:${animationPlayed}`);
      
      if (hasPulls && isActive && !animationPlayed) {
        // Check sessionStorage as backup
        if (wasAnimationSeen()) {
          console.log(`[${source}] Already seen in session, showing final state`);
          setAnimationPlayed(true);
          setWinner(battleData.isDraw ? null : battleData.winnerId);
          setBattleComplete(true);
          setBattle(battleData);
          return true;
        }
        
        console.log(`[${source}] >>> TRIGGERING ANIMATION <<<`);
        setAnimationPlayed(true);
        markAnimationAsSeen();
        runAnimation(battleData);
        return true;
      }
      return false;
    };
    
    // Check initial data on mount
    const initialCheck = () => {
      console.log('[MOUNT] Initial battle state check');
      if (checkAndAnimate(initialBattle, 'MOUNT')) {
        // Animation started from initial data, no need to poll
        return true;
      }
      return false;
    };
    
    // If initial check triggers animation, we're done
    if (initialCheck()) {
      return;
    }
    
    // Start polling for updates
    console.log('[POLL] Starting polling...');
    
    const poll = async () => {
      // Don't poll if animation already played
      if (animationPlayed) {
        console.log('[POLL] Animation already played, stopping');
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        return;
      }
      
      try {
        const response = await fetch(`/api/battles/${battleId}/status`);
        if (!response.ok) {
          console.log('[POLL] Response not ok:', response.status);
          return;
        }
        
        const data = await response.json();
        if (!data.battle) {
          console.log('[POLL] No battle data in response');
          return;
        }
        
        console.log('[POLL] Got battle - status:', data.battle.status, 'pulls:', data.battle.pulls?.length || 0);
        
        // Check if we should trigger animation FIRST (before updating state)
        const shouldAnimate = checkAndAnimate(data.battle, 'POLL');
        
        if (shouldAnimate) {
          // Animation triggered, stop polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          // Don't update battle state here - runAnimation will handle it at the end
        } else {
          // Only update battle state if not animating (for ready status updates etc)
          setBattle(data.battle);
        }
      } catch (error) {
        console.error('[POLL] Error:', error);
      }
    };
    
    // Start polling immediately
    poll();
    pollingIntervalRef.current = setInterval(poll, POLL_INTERVAL);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [initialBattle, animationPlayed, wasAnimationSeen, markAnimationAsSeen, runAnimation]);

  const toggleReady = async () => {
    if (!currentUserId || !isParticipant || readyLoading) return;
    
    setReadyLoading(true);
    try {
      const method = amIReady ? 'DELETE' : 'POST';
      const response = await fetch(`/api/battles/${battle.id}/ready`, { method });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update ready status');
      }
      
      // Update local battle state
      setBattle((prev: any) => ({
        ...prev,
        participants: prev.participants.map((p: any) => 
          p.userId === currentUserId ? { ...p, isReady: !amIReady } : p
        ),
      }));
      
      addToast({
        title: amIReady ? 'Unreadied' : 'Ready!',
        description: amIReady ? 'You are no longer ready' : 'Waiting for other players...',
      });
      
    } catch (error) {
      addToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update ready status',
        variant: 'destructive',
      });
    } finally {
      setReadyLoading(false);
    }
  };

  const startBattleWithAnimation = async () => {
    if (!humanParticipantsReady) {
      addToast({
        title: 'Not Ready',
        description: 'All participants must be ready before starting',
        variant: 'destructive',
      });
      return;
    }
    
    if (animationPlayed || isDrawing) {
      console.log('[START] Already started or drawing');
      return;
    }
    
    setStarting(true);
    
    // Stop polling immediately
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    try {
      console.log('[START] Calling start battle API...');
      const response = await fetch(`/api/battles/${battle.id}/start`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start battle');
      }

      console.log('[START] Battle started! Playing animation...');
      
      // Mark as played BEFORE animation
      setAnimationPlayed(true);
      markAnimationAsSeen();
      
      // Run animation
      runAnimation(data.battle);
      
    } catch (error) {
      // Reset on error
      setStarting(false);
      addToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start battle',
        variant: 'destructive',
      });
    }
  };
  

  const joinBattle = async () => {
    if (!currentUserId || joining) return;
    
    setJoining(true);
    try {
      const response = await fetch(`/api/battles/${battle.id}/join`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join battle');
      }

      setBattle(data.battle);
      addToast({
        title: 'Joined Battle! 🎮',
        description: `${data.coinsDeducted} coins deducted. New balance: ${data.newBalance} coins`,
      });
      
      // Refresh the page to update all state
      router.refresh();
    } catch (error) {
      addToast({
        title: 'Failed to Join',
        description: error instanceof Error ? error.message : 'Could not join the battle',
        variant: 'destructive',
      });
    } finally {
      setJoining(false);
    }
  };

  const getBattleModeLabel = () => {
    if (battle.shareMode) return 'Share Mode';
    switch (battle.battleMode) {
      case 'UPSIDE_DOWN':
        return 'Lowest Wins';
      case 'JACKPOT':
        return 'Jackpot';
      default:
        return 'Highest Wins';
    }
  };

  const getStatusBadge = () => {
    switch (battle.status) {
      case 'WAITING':
        return <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-semibold">Waiting</span>;
      case 'IN_PROGRESS':
        return <span className="px-3 py-1 rounded-full bg-[rgba(191,255,0,0.1)] text-[#BFFF00] text-sm font-semibold">In Progress</span>;
      case 'FINISHED':
        return <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-semibold">Finished</span>;
      case 'CANCELLED':
        return <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-semibold">Cancelled</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-[#12123a]/50 text-[#8888aa] text-sm font-semibold">{battle.status}</span>;
    }
  };

  const participants = battle.participants || [];
  const displayParticipants = isAdmin ? participants : participants.filter((p: any) => !p.user?.isBot);
  const spotsLeft = Math.max(0, battle.maxParticipants - participants.length);

  // Group pulls by participant for display
  const pullsByParticipant = allPulls.reduce((acc: any, pull) => {
    if (!acc[pull.participantId]) {
      acc[pull.participantId] = [];
    }
    acc[pull.participantId].push(pull);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#06061a] via-[#0B0B2B] to-[#06061a] font-display">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />
      <div className="fixed inset-0 radial-gradient pointer-events-none" />

      <div className="relative container py-12">
        {/* Back Button */}
        <div className="mb-8">
          <Link 
            href="/battles"
            className="inline-flex items-center gap-2 text-[#8888aa] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Battles
          </Link>
        </div>

        {/* Winner / Draw Announcement */}
        <AnimatePresence>
          {battleComplete && (winner || battle?.isDraw) && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mb-8"
            >
              {battle?.isDraw ? (
                <div className="relative overflow-hidden rounded-3xl border border-[rgba(191,255,0,0.3)] bg-gradient-to-br from-[rgba(191,255,0,0.05)] via-slate-900/20 to-[rgba(191,255,0,0.05)] p-8">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[rgba(191,255,0,0.1)] via-transparent to-transparent" />
                  <div className="relative flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#BFFF00] to-[#8fbf00] shadow-lg shadow-[rgba(191,255,0,0.3)]">
                      <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="9" x2="19" y2="9"/><line x1="5" y1="15" x2="19" y2="15"/></svg>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-1">It's a Draw!</h2>
                      <p className="text-xl text-[#f0f0f5]">
                        All players had the same total value — everyone keeps their own cards.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-3xl border border-yellow-500/30 bg-gradient-to-br from-yellow-900/30 via-amber-900/20 to-orange-900/30 p-8">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent" />
                  <div className="relative flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 shadow-lg shadow-yellow-500/30">
                      <Trophy className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-1">Battle Complete!</h2>
                      <p className="text-xl text-[#f0f0f5]">
                        Winner: <span className="font-bold text-yellow-400">{battle.winner?.name || battle.winner?.email}</span>
                        {battle.totalPrize > 0 && (
                          <span className="ml-3 text-[#8888aa]">• Prize: <span className="text-yellow-400">{battle.totalPrize} coins</span></span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ready Up Section - For participants who need to ready up */}
        {isParticipant && isBattleFull && battle.status === 'WAITING' && !battleComplete && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className={`rounded-3xl border p-6 ${
              amIReady 
                ? 'border-green-500/30 bg-gradient-to-br from-green-900/30 to-emerald-900/20' 
                : 'border-yellow-500/30 bg-gradient-to-br from-yellow-900/30 to-orange-900/20'
            }`}>
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                    amIReady 
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                      : 'bg-gradient-to-br from-yellow-500 to-orange-600'
                  }`}>
                    {amIReady ? <Check className="w-6 h-6 text-white" /> : <Clock className="w-6 h-6 text-white" />}
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold ${amIReady ? 'text-green-400' : 'text-yellow-400'}`}>
                      {amIReady ? "You're Ready!" : 'Ready Up!'}
                    </h3>
                    <p className="text-[#8888aa]">
                      {humanParticipantsReady 
                        ? 'All players ready! Waiting for battle to start...' 
                        : `Waiting for ${battle.participants.filter((p: any) => !p.isReady && !p.user?.isBot).length} player(s) to ready up`
                      }
                    </p>
                  </div>
                </div>
                <Button
                  onClick={toggleReady}
                  disabled={readyLoading}
                  size="lg"
                  className={amIReady 
                    ? 'bg-[#12123a] hover:bg-[#12123a]/80 text-white font-bold px-8' 
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-8'
                  }
                >
                  {readyLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : amIReady ? (
                    'Cancel Ready'
                  ) : (
                    "I'm Ready!"
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Auto-Start Countdown - Show when battle is full and waiting */}
        {isBattleFull && battle.status === 'WAITING' && !battleComplete && timeUntilAutoStart !== null && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className={`rounded-3xl border p-6 ${
              timeUntilAutoStart <= 300 
                ? 'border-orange-500/30 bg-gradient-to-br from-orange-900/30 to-red-900/20' 
                : 'border-[rgba(191,255,0,0.3)] bg-gradient-to-br from-[rgba(191,255,0,0.05)] to-[rgba(191,255,0,0.03)]'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${
                  timeUntilAutoStart <= 300 
                    ? 'bg-gradient-to-br from-orange-500 to-red-600' 
                    : 'bg-gradient-to-br from-[#BFFF00] to-[#8fbf00]'
                }`}>
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className={`text-xl font-bold ${
                    timeUntilAutoStart <= 300 ? 'text-orange-400' : 'text-[#BFFF00]'
                  }`}>
                    Auto-Start Timer
                  </h3>
                  <p className="text-[#8888aa]">
                    {timeUntilAutoStart <= 0 
                      ? 'Battle will start automatically any moment now...' 
                      : `Battle will start automatically in ${formatTimeRemaining(timeUntilAutoStart)}`}
                  </p>
                </div>
                <div className={`text-3xl font-bold ${
                  timeUntilAutoStart <= 300 ? 'text-orange-400' : 'text-[#BFFF00]'
                }`}>
                  {formatTimeRemaining(timeUntilAutoStart)}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Start Battle Button - Only for creator/admin when all are ready */}
        {canStartBattle && !battleComplete && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="rounded-3xl border border-green-500/30 bg-gradient-to-br from-green-900/30 to-emerald-900/20 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-green-400">All Players Ready!</h3>
                    <p className="text-[#8888aa]">Everyone is ready. Start the battle now!</p>
                  </div>
                </div>
                <Button
                  onClick={startBattleWithAnimation}
                  disabled={starting || isDrawing}
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-8"
                >
                  {starting ? 'Starting...' : 'Start Battle'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Join Battle Section - For users who haven't joined yet */}
        {canJoinBattle && !battleComplete && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="rounded-3xl border border-[rgba(191,255,0,0.2)] bg-gradient-to-br from-[#0B0B2B]/60 to-[#12123a]/40 p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#BFFF00] to-[#a0d600]">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#BFFF00]">Join this Battle!</h3>
                    <p className="text-[#8888aa]">
                      {battle.participants.length}/{battle.maxParticipants} spots filled • 
                      Cost: <span className="text-yellow-400 font-semibold">{battle.entryFee + (battle.box?.price || 0) * battle.rounds} coins</span>
                    </p>
                  </div>
                </div>
                <Button
                  onClick={joinBattle}
                  disabled={joining}
                  size="lg"
                  className="bg-gradient-to-r from-[#BFFF00] to-[#a0d600] hover:bg-[#d4ff4d] text-white font-bold px-8"
                >
                  {joining ? 'Joining...' : 'Join Battle'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Current Card Reveal Modal */}
        <AnimatePresence>
          {isShowingReveal && currentReveal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0B2B]/80 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.5, rotateY: 180 }}
                animate={{ scale: 1, rotateY: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', duration: 0.6 }}
                className="relative"
              >
                <div className="relative rounded-3xl border-2 border-[rgba(191,255,0,0.3)] bg-[#0B0B2B]/95 p-8 max-w-sm shadow-[0_0_24px_rgba(191,255,0,0.3)]">
                  {/* Header */}
                  <div className="text-center mb-6">
                    <p className="text-[#BFFF00] font-semibold mb-1">Round {currentReveal.roundNumber}</p>
                    <p className="text-2xl font-bold text-white">
                      {currentReveal.participantName}
                      {isAdmin && currentReveal.isBot && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs">Bot</span>
                      )}
                    </p>
                  </div>
                  
                  {/* Card Image */}
                  {currentReveal.card && (
                    <div className="space-y-4">
                      <div className="relative h-80 w-56 mx-auto overflow-hidden rounded-xl border-2 border-[rgba(255,255,255,0.06)] shadow-xl">
                        <Image
                          src={currentReveal.card.imageUrlGatherer || currentReveal.card.imageUrlScryfall}
                          alt={currentReveal.card.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-white mb-1">{currentReveal.card.name}</p>
                        <p className="text-[#8888aa] text-sm mb-3">{currentReveal.card.rarity}</p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/30">
                          <Coins className="w-5 h-5 text-yellow-400" />
                          <span className="text-2xl font-bold text-yellow-400">{currentReveal.coinValue}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Sparkle Effects */}
                <Sparkles className="absolute -top-4 -left-4 w-8 h-8 text-[#BFFF00] animate-pulse" />
                <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-[#BFFF00] animate-pulse" />
                <Sparkles className="absolute -bottom-4 -left-4 w-8 h-8 text-yellow-400 animate-pulse" />
                <Sparkles className="absolute -bottom-4 -right-4 w-8 h-8 text-yellow-400 animate-pulse" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Round Winner Announcement */}
        <AnimatePresence>
          {showingRoundWinner && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0B2B]/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="rounded-3xl border border-green-500/50 bg-[#0B0B2B]/95 p-8 max-w-md text-center shadow-2xl"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mb-4">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <p className="text-green-400 font-semibold mb-2">Round {showingRoundWinner.roundNumber} Winner</p>
                <p className="text-2xl font-bold text-white mb-4">{showingRoundWinner.winnerName}</p>
                {showingRoundWinner.winningCard && (
                  <div className="flex items-center justify-center gap-3 text-[#f0f0f5]">
                    <span>{showingRoundWinner.winningCard.name}</span>
                    <span className="text-yellow-400 font-bold">{showingRoundWinner.winningValue} coins</span>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Battle Info Card */}
            <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Battle #{battle.id.slice(-6)}</h1>
                {getStatusBadge()}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 text-[#8888aa] mb-1">
                    <Swords className="w-4 h-4" />
                    <span className="text-sm">Mode</span>
                  </div>
                  <p className="text-white font-semibold">{getBattleModeLabel()}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 text-[#8888aa] mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Players</span>
                  </div>
                  <p className="text-white font-semibold">{participants.length}/{battle.maxParticipants}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 text-[#8888aa] mb-1">
                    <Coins className="w-4 h-4" />
                    <span className="text-sm">Entry Fee</span>
                  </div>
                  <p className="text-white font-semibold">{battle.entryFee} coins</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 text-[#8888aa] mb-1">
                    <Package className="w-4 h-4" />
                    <span className="text-sm">Rounds</span>
                  </div>
                  <p className="text-white font-semibold">
                    {isDrawing ? `${currentRound}/${battle.rounds}` : battle.rounds}
                  </p>
                </div>
              </div>
            </div>

            {/* Participants */}
            <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-3xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">
                {allPulls.length > 0 ? 'Battle Progress' : 'Participants'}
              </h2>
              
              {isAdmin && spotsLeft > 0 && !battleComplete && (
                <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                  <AddBotsControl battleId={battle.id} maxAddable={spotsLeft} />
                </div>
              )}
              
              <div className="space-y-4">
                {displayParticipants.map((participant: any) => {
                  const pulls = pullsByParticipant[participant.userId] || [];
                  const total = participantTotals.get(participant.userId) || 0;
                  const isWinner = !battle?.isDraw && winner === participant.userId;
                  const isDrawResult = battleComplete && battle?.isDraw;
                  
                  return (
                    <motion.div
                      key={participant.id}
                      layout
                      className={`rounded-2xl border p-5 transition-all ${
                        isDrawResult
                          ? 'border-[rgba(191,255,0,0.3)] bg-gradient-to-br from-[rgba(191,255,0,0.05)] to-slate-900/20'
                          : isWinner 
                            ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-900/30 to-amber-900/20' 
                            : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-white">
                            {participant.user?.name || participant.user?.email}
                          </span>
                          {isAdmin && participant.user?.isBot && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold">
                              Bot
                            </span>
                          )}
                          {isDrawResult && (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[rgba(191,255,0,0.1)] text-[#BFFF00] text-xs font-semibold">
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="9" x2="19" y2="9"/><line x1="5" y1="15" x2="19" y2="15"/></svg>
                              Draw
                            </div>
                          )}
                          {isWinner && (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-semibold">
                              <Trophy className="w-3 h-3" />
                              Winner
                            </div>
                          )}
                          {/* Ready Status - Show when battle is waiting and full */}
                          {battle.status === 'WAITING' && isBattleFull && !participant.user?.isBot && (
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                              participant.isReady 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-[#12123a]/50 text-[#8888aa]'
                            }`}>
                              {participant.isReady ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  Ready
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3" />
                                  Waiting
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Coins className="w-5 h-5 text-yellow-400" />
                          <motion.span 
                            key={total}
                            initial={{ scale: 1.2 }}
                            animate={{ scale: 1 }}
                            className="text-xl font-bold text-yellow-400"
                          >
                            {total.toFixed(0)}
                          </motion.span>
                        </div>
                      </div>
                      
                      {pulls.length > 0 && (
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                          {pulls.map((pull: PullResult, index: number) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05 }}
                              className="group relative cursor-pointer"
                              title={`${pull.card?.name || 'Unknown'} - ${pull.coinValue} coins`}
                            >
                              <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-white/20 bg-[#12123a]">
                                {pull.card && (
                                  <Image
                                    src={pull.card.imageUrlGatherer || pull.card.imageUrlScryfall}
                                    alt={pull.card.name}
                                    fill
                                    className="object-cover transition-transform group-hover:scale-110"
                                    unoptimized
                                  />
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-1">
                                  <p className="text-xs text-yellow-400 font-bold text-center">
                                    {pull.coinValue}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Round Results */}
            {roundResults.length > 0 && (
              <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-3xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Round Results</h2>
                <div className="space-y-3">
                  {roundResults.map((round) => (
                    <motion.div
                      key={round.roundNumber}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#BFFF00] to-[#a0d600] flex items-center justify-center text-white font-bold">
                          {round.roundNumber}
                        </div>
                        <div>
                          <p className="text-white font-semibold">{round.winnerName}</p>
                          <p className="text-[#8888aa] text-sm">{round.winningCard?.name || 'Unknown'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {round.winningCard && (
                          <div className="relative w-12 h-16 rounded overflow-hidden border border-white/20">
                            <Image
                              src={round.winningCard.imageUrlGatherer || round.winningCard.imageUrlScryfall}
                              alt={round.winningCard.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-yellow-400 font-bold">
                          <Coins className="w-4 h-4" />
                          {round.winningValue}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Box Details - Fanned Card Style */}
            <div className="bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md rounded-xl overflow-hidden hover:-translate-y-1.5 hover:shadow-[0_8px_30px_rgba(191,255,0,0.1)] transition-all duration-300">
              {/* Card Preview Section - Fanned Cards */}
              <div className="relative h-48 bg-gradient-to-b from-[#12123a]/50 to-[#0B0B2B]/80 flex items-end justify-center pb-2 overflow-hidden">
                {/* Background glow effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 via-transparent to-transparent" />
                
                {/* Fanned Cards Display */}
                {battle.box?.cards && battle.box.cards.length > 0 ? (
                  <div className="relative h-40 w-full flex items-center justify-center">
                    {battle.box.cards.slice(0, 3).map((card: any, index: number) => {
                      const rotations = [-15, 0, 15];
                      const translations = [-20, 0, 20];
                      const zIndexes = [1, 3, 2];
                      return (
                        <div
                          key={card.id || index}
                          className="absolute transition-transform duration-300 hover:scale-105"
                          style={{
                            transform: `rotate(${rotations[index]}deg) translateX(${translations[index]}px)`,
                            zIndex: zIndexes[index],
                          }}
                        >
                          <div className="relative w-20 h-[110px] rounded-md overflow-hidden border-2 border-[rgba(255,255,255,0.06)] shadow-lg hover:border-amber-400/50 transition-colors bg-[#12123a]">
                            {card.imageUrlGatherer || card.imageUrlScryfall ? (
                              <Image
                                src={card.imageUrlGatherer || card.imageUrlScryfall}
                                alt={card.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-[#12123a]">
                                <span className="text-[8px] text-[#8888aa]">?</span>
                              </div>
                            )}
                            {/* Value badge on top card */}
                            {index === 1 && card.coinValue && (
                              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-[#0B0B2B]/80 flex items-center gap-0.5">
                                <Coins className="w-2 h-2 text-amber-400" />
                                <span className="text-[8px] font-bold text-amber-400">{card.coinValue}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : battle.box?.imageUrl ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={battle.box.imageUrl}
                      alt={battle.box.name}
                      fill
                      className="object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B2B] to-transparent" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package className="w-12 h-12 text-[#8888aa]" />
                  </div>
                )}

                {/* Game Badge */}
                {battle.box?.games && battle.box.games[0] && (
                  <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold badge-${battle.box.games[0].toLowerCase()} z-10`}>
                    {battle.box.games[0]}
                  </div>
                )}
              </div>

              {/* Box Info */}
              <div className="p-4 border-t border-[rgba(255,255,255,0.1)]">
                <h3 className="text-sm font-semibold text-white mb-2 line-clamp-1">
                  {battle.box?.name || 'Unknown Box'}
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-bold text-amber-400">{battle.box?.price?.toLocaleString() || 0}</span>
                    <span className="text-xs text-[#8888aa]">coins</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-[rgba(255,255,255,0.1)]/50 flex items-center justify-between text-[11px] text-[#8888aa]">
                  <span>{battle.box?.cardsPerPack || 1} cards/pack</span>
                  <span>{battle.rounds} rounds</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-3xl p-6">
              <div className="space-y-3">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/battles">View All Battles</Link>
                </Button>
                {currentUserId && (
                  <Button asChild className="w-full bg-[#BFFF00] hover:bg-[#d4ff4d] text-black">
                    <Link href="/battles/create">Create New Battle</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
