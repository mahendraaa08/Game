import { EventBus } from '../utils/EventBus';
import { StorageManager } from '../utils/StorageManager';

/**
 * Isolated Developer & QA Tools configuration.
 * Set `enabled` to `false` or remove this module + DevToolsSettingsSection to disable cleanly.
 */
export const DEV_TOOLS_CONFIG = {
  enabled: true,
  redeemCode: 'M4H3N',
  redeemCredits: 10000,
  redeemGems: 5000,
} as const;

export interface DevToolActionResult {
  ok: boolean;
  message: string;
}

export function resetPlayerProgressFromDevTools(): DevToolActionResult {
  if (!DEV_TOOLS_CONFIG.enabled) {
    return { ok: false, message: 'Developer tools are currently disabled.' };
  }

  const fresh = StorageManager.resetAllProgress();
  EventBus.emit('ui:select-ship', fresh.selectedShip);
  EventBus.emit('ui:select-weapon', fresh.selectedWeapon);
  EventBus.emit('ui:select-special', fresh.selectedSpecial);
  EventBus.emit('progress:updated');

  return {
    ok: true,
    message: 'All player progress has been reset to initial starting state.',
  };
}

export function redeemDeveloperCode(rawCode: string): DevToolActionResult {
  if (!DEV_TOOLS_CONFIG.enabled) {
    return { ok: false, message: 'Developer tools are currently disabled.' };
  }

  const code = rawCode.trim();
  if (!code) {
    return { ok: false, message: 'Please enter a redeem code first.' };
  }

  if (code !== DEV_TOOLS_CONFIG.redeemCode) {
    return { ok: false, message: 'Invalid redeem code. Please check and try again.' };
  }

  StorageManager.update((draft) => {
    draft.credits = Math.max(0, Math.floor(draft.credits)) + DEV_TOOLS_CONFIG.redeemCredits;
    draft.crystals = Math.max(0, Math.floor(draft.crystals)) + DEV_TOOLS_CONFIG.redeemGems;
  });

  EventBus.emit('progress:updated');

  return {
    ok: true,
    message: `Code redeemed! +${DEV_TOOLS_CONFIG.redeemCredits.toLocaleString()} Credits & +${DEV_TOOLS_CONFIG.redeemGems.toLocaleString()} Gems added.`,
  };
}
