import type { Category } from '../types';

export const CATEGORY_OPTIONS: Array<{ id: Category; label: string }> = [
  { id: 'tools', label: '效率工具' },
  { id: 'saas', label: '独立开发' },
  { id: 'games', label: '互动游戏' },
  { id: 'automation', label: '自动化流' },
  { id: 'creative', label: '创意工程' },
];

export const CATEGORY_LABELS = Object.fromEntries(
  CATEGORY_OPTIONS.map((item) => [item.id, item.label])
) as Record<Category, string>;
