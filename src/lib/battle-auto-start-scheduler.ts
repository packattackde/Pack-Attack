/**
 * Battle Auto-Start & Lobby Expiry Scheduler
 *
 * Runs every minute and calls /api/battles/auto-start which handles:
 * 1. Cancelling OPEN battles past their 15-minute lobbyExpiresAt (with refund)
 * 2. Auto-starting FULL/READY battles past their 3-minute autoStartAt
 */

import cron from 'node-cron';

const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key';
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export function startBattleAutoStartScheduler() {
  console.log('[SCHEDULER] Starting battle scheduler (lobby expiry + auto-start)...');

  cron.schedule('* * * * *', async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/battles/auto-start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CRON_SECRET}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.expired > 0 || result.processed > 0) {
        console.log(`[SCHEDULER] Expired: ${result.expired}, Auto-started: ${result.processed}`);
        if (result.results?.length > 0) {
          console.log('[SCHEDULER] Results:', result.results);
        }
      }
    } catch (error) {
      console.error('[SCHEDULER] Error:', error);
    }
  });

  console.log('[SCHEDULER] Battle scheduler is running (every minute)');
}

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  console.log('Starting standalone battle scheduler...');
  startBattleAutoStartScheduler();
  console.log('Scheduler is now running. Press Ctrl+C to stop.');
}
