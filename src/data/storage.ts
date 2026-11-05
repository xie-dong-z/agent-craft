import type { Creation } from '../types';
import { SEED_CREATIONS } from './seedCreations';
import {
  isCloudConfigured,
  fetchCloudCreations,
  insertCloudCreation,
  incrementCloudLike,
} from '../services/supabase';

const STORAGE_KEY = 'agent_craft_creations_v2_30projects';
const LIKES_KEY = 'agent_craft_user_likes_v2';

export function getStoredCreations(): Creation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_CREATIONS));
      return SEED_CREATIONS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length < 20) {
      // Auto-migrate to 30 projects while preserving any user submissions
      const userSubmissions = Array.isArray(parsed)
        ? parsed.filter((item) => !SEED_CREATIONS.some((seed) => seed.id === item.id))
        : [];
      const migrated = [...userSubmissions, ...SEED_CREATIONS];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    return parsed as Creation[];
  } catch (err) {
    console.error('Failed to load creations from storage:', err);
    return SEED_CREATIONS;
  }
}

/**
 * Sync creations from Cloud Supabase and merge with local seed
 */
export async function syncCreationsFromCloud(): Promise<Creation[]> {
  if (!isCloudConfigured) return getStoredCreations();
  try {
    const cloudItems = await fetchCloudCreations();
    if (cloudItems.length === 0) return getStoredCreations();

    const localItems = getStoredCreations();
    const map = new Map<string, Creation>();

    // Put seeds & local first
    localItems.forEach((item) => map.set(item.id, item));
    // Overwrite / add cloud creations
    cloudItems.forEach((item) => map.set(item.id, item));

    const merged = Array.from(map.values());
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // Ignore quota
    }
    return merged;
  } catch (err) {
    console.warn('Could not sync from cloud database:', err);
    return getStoredCreations();
  }
}

export function saveCreation(creation: Creation): { creations: Creation[]; error?: string } {
  const current = getStoredCreations();
  const updated = [creation, ...current];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save creation to local storage:', err);
  }

  // Asynchronously submit to cloud if connected
  if (isCloudConfigured) {
    insertCloudCreation(creation).catch((err) => {
      console.warn('Cloud submission queued with notice:', err);
    });
  }

  return { creations: updated };
}

export function resetToSeedData(): Creation[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_CREATIONS));
    localStorage.removeItem(LIKES_KEY);
  } catch (err) {
    console.error('Failed to reset storage:', err);
  }
  return SEED_CREATIONS;
}

export function exportCreationsJSON(creations: Creation[]) {
  try {
    const blob = new Blob([JSON.stringify(creations, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute(
      'download',
      `agent-craft-creations-${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error('Failed to export creations:', err);
  }
}

export function getUserLikes(): string[] {
  try {
    const raw = localStorage.getItem(LIKES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleLikeCreation(id: string): { updatedCreations: Creation[]; isLiked: boolean } {
  const current = getStoredCreations();
  const likes = getUserLikes();
  const alreadyLiked = likes.includes(id);

  let nextLikes: string[];
  let nextCreations: Creation[];

  if (alreadyLiked) {
    nextLikes = likes.filter((item) => item !== id);
    nextCreations = current.map((item) =>
      item.id === id ? { ...item, stats: { ...item.stats, likes: Math.max(0, item.stats.likes - 1) } } : item
    );
  } else {
    nextLikes = [...likes, id];
    nextCreations = current.map((item) =>
      item.id === id ? { ...item, stats: { ...item.stats, likes: item.stats.likes + 1 } } : item
    );
    if (isCloudConfigured) {
      incrementCloudLike(id).catch(() => {});
    }
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCreations));
    localStorage.setItem(LIKES_KEY, JSON.stringify(nextLikes));
  } catch (err) {
    console.error('Failed to update likes:', err);
  }

  return { updatedCreations: nextCreations, isLiked: !alreadyLiked };
}

export function computeGlobalStats(creations: Creation[]) {
  const totalCreations = creations.length;
  const agentsSet = new Set(creations.map((c) => c.agentTool));
  const openSourceCount = creations.filter((c) => c.openSource.isAvailable).length;
  const totalLikes = creations.reduce((acc, c) => acc + c.stats.likes, 0);

  return {
    totalCreations,
    totalAgents: agentsSet.size,
    openSourceCount,
    totalLikes,
  };
}
