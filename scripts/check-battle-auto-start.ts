#!/usr/bin/env tsx
/**
 * Battle Auto-Start Checker
 * 
 * Checks for full battles waiting 5+ minutes and auto-starts them.
 * Runs every minute via PM2 cron.
 */

// Load .env file
import { readFileSync } from 'fs';
import { join } from 'path';

const envPath = join(process.cwd(), '.env');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=["']?([^"'\r\n]*)["']?$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
} catch (e) {
  console.log('[AUTO-START] Warning: Could not load .env file');
}

const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key';
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function checkAndStartBattles() {
  try {
    console.log('[AUTO-START] Checking for battles to auto-start...');
    
    const response = await fetch(`${API_BASE_URL}/api/battles/auto-start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    console.log('[AUTO-START] Check completed');
    console.log(`[AUTO-START] Processed: ${result.processed} battles`);
    
    if (result.results && result.results.length > 0) {
      console.log('[AUTO-START] Results:');
      result.results.forEach((r: any) => {
        console.log(`  - Battle ${r.battleId}: ${r.status}${r.error ? ` (${r.error})` : ''}`);
      });
    }

    return result;
  } catch (error) {
    console.error('[AUTO-START] Error:', error);
    throw error;
  }
}

// Run the check
checkAndStartBattles()
  .then(() => {
    console.log('[AUTO-START] Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[AUTO-START] Failed:', error);
    process.exit(1);
  });
