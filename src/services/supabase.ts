import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Creation } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isCloudConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-ref')
);

export const supabase: SupabaseClient | null = isCloudConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

export interface DbCreationRow {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  agent_tool: string;
  author: Creation['author'];
  media: Creation['media'];
  recipe: Creation['recipe'];
  open_source: Creation['openSource'];
  stats: Creation['stats'];
  is_approved: boolean;
  created_at: string;
}

export function rowToCreation(row: DbCreationRow): Creation {
  return {
    id: row.id,
    title: row.title,
    tagline: row.tagline,
    description: row.description,
    category: row.category as Creation['category'],
    agentTool: row.agent_tool as Creation['agentTool'],
    author: row.author,
    media: row.media,
    recipe: row.recipe,
    openSource: row.open_source,
    stats: {
      ...row.stats,
      createdAt: row.created_at ? row.created_at.split('T')[0] : row.stats?.createdAt || '',
    },
  };
}

export function creationToRow(creation: Creation): Partial<DbCreationRow> {
  return {
    id: creation.id,
    title: creation.title,
    tagline: creation.tagline,
    description: creation.description,
    category: creation.category,
    agent_tool: creation.agentTool,
    author: creation.author,
    media: creation.media,
    recipe: creation.recipe,
    open_source: creation.openSource,
    stats: creation.stats,
    is_approved: true, // Default to true, or configure to require admin approval
  };
}

/**
 * Fetch all community creations from cloud Supabase
 */
export async function fetchCloudCreations(): Promise<Creation[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('creations')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch notice:', error.message);
      return [];
    }

    return (data as DbCreationRow[]).map(rowToCreation);
  } catch (err) {
    console.warn('Network error reaching Supabase:', err);
    return [];
  }
}

/**
 * Insert a newly submitted creation to cloud Supabase
 */
export async function insertCloudCreation(creation: Creation): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: '未连接云端数据库' };
  }
  try {
    const row = creationToRow(creation);
    const { error } = await supabase.from('creations').insert(row);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '网络异常，提交失败';
    return { success: false, error: message };
  }
}

/**
 * Increment like counter for a creation in Supabase
 */
export async function incrementCloudLike(id: string): Promise<void> {
  if (!supabase) return;
  try {
    const { data } = await supabase
      .from('creations')
      .select('stats')
      .eq('id', id)
      .maybeSingle();

    if (data && data.stats) {
      const newStats = {
        ...data.stats,
        likes: (data.stats.likes || 0) + 1,
      };
      await supabase.from('creations').update({ stats: newStats }).eq('id', id);
    }
  } catch {
    // Graceful offline fallback
  }
}
