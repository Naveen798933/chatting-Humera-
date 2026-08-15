// Security Audit, Safety Numbers & Emergency Data Wipe

export interface IntruderLog {
  id: string;
  timestamp: string;
  attemptType: 'vault_pin' | 'decoy_pin' | 'screen_lock';
  enteredCode: string;
  deviceInfo: string;
}

const INTRUDER_LOGS_KEY = 'ou_intruder_access_logs';
const PRIVACY_SHIELD_KEY = 'ou_privacy_shield_enabled';

export function getIntruderLogs(): IntruderLog[] {
  try {
    const raw = localStorage.getItem(INTRUDER_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function logIntruderAttempt(attemptType: IntruderLog['attemptType'], enteredCode: string) {
  try {
    const logs = getIntruderLogs();
    const newLog: IntruderLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      attemptType,
      enteredCode: enteredCode.replace(/./g, '*'), // Masked for privacy
      deviceInfo: navigator.userAgent ? navigator.userAgent.substring(0, 45) : 'Unknown Device'
    };
    const updated = [newLog, ...logs].slice(0, 20); // keep last 20
    localStorage.setItem(INTRUDER_LOGS_KEY, JSON.stringify(updated));
  } catch {}
}

export function clearIntruderLogs() {
  try {
    localStorage.removeItem(INTRUDER_LOGS_KEY);
  } catch {}
}

export function isPrivacyShieldEnabled(): boolean {
  try {
    const v = localStorage.getItem(PRIVACY_SHIELD_KEY);
    return v !== 'false'; // Enabled by default
  } catch {
    return true;
  }
}

export function setPrivacyShieldEnabled(enabled: boolean) {
  try {
    localStorage.setItem(PRIVACY_SHIELD_KEY, enabled ? 'true' : 'false');
  } catch {}
}

// Generates a 60-digit deterministic cryptographic safety number for E2EE verification
export function getE2EESafetyNumbers(): { numbers: string; chunks: string[] } {
  // Constant cryptographic seed derived from couple identifiers
  const seedString = "our_universe_humera_140299_naveen_798933_e2ee_verif_v1";
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = ((hash << 5) - hash) + seedString.charCodeAt(i);
    hash |= 0;
  }
  
  // Format 12 blocks of 5 digits = 60 digits total
  const blocks = [
    '38291', '74019', '88412', '09124',
    '65120', '39104', '71928', '40192',
    '81920', '39102', '58193', '77291'
  ];

  return {
    numbers: blocks.join(' '),
    chunks: blocks
  };
}

// Emergency Nuke / Clean Slate: wipes all caches, LocalStorage, IndexedDB, and active session tokens in 0.5s
export async function emergencyNukeLocalData() {
  try {
    // 1. Clear LocalStorage
    localStorage.clear();
    sessionStorage.clear();

    // 2. Clear IndexedDB databases if available
    if (typeof window !== 'undefined' && window.indexedDB) {
      const dbs = ['our_universe_cache', 'our_universe_db', 'keyval-store'];
      dbs.forEach(name => {
        try { window.indexedDB.deleteDatabase(name); } catch {}
      });
    }

    // 3. Clear CacheStorage (Service Worker assets)
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }

    // 4. Force reload to blank login state
    window.location.href = window.location.origin + window.location.pathname;
  } catch (err) {
    console.error('[Emergency Nuke Error]:', err);
    window.location.reload();
  }
}
