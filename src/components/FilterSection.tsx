import React, { useRef, useEffect } from 'react';
import type { AgentTool, Category } from '../types';
import { CATEGORY_OPTIONS } from '../constants/category';
import { Search, X, Code2, BookOpen, ArrowUpDown, Heart, RotateCcw, LayoutGrid, List } from 'lucide-react';

export type SortOption = 'default' | 'likes' | 'newest' | 'stars';

interface FilterSectionProps {
  selectedAgent: string;
  onSelectAgent: (agent: string) => void;
  availableAgents?: string[];
  selectedCategory: Category | 'ALL';
  onSelectCategory: (category: Category | 'ALL') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  openSourceOnly: boolean;
  onToggleOpenSource: () => void;
  recipeOnly: boolean;
  onToggleRecipe: () => void;
  likesOnly?: boolean;
  onToggleLikesOnly?: () => void;
  userLikesCount?: number;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  resultCount: number;
  onResetFilters?: () => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
}

const DEFAULT_AGENTS: AgentTool[] = [
  'Claude Code',
  'Cursor',
  'Antigravity',
  'Devin',
  'v0 / Bolt',
  'AutoGen / CrewAI',
  'Custom Agent',
];

const CATEGORIES = CATEGORY_OPTIONS;

export const FilterSection: React.FC<FilterSectionProps> = ({
  selectedAgent,
  onSelectAgent,
  availableAgents = DEFAULT_AGENTS,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  openSourceOnly,
  onToggleOpenSource,
  recipeOnly,
  onToggleRecipe,
  likesOnly = false,
  onToggleLikesOnly,
  userLikesCount = 0,
  sortBy,
  onSortChange,
  resultCount,
  onResetFilters,
  viewMode = 'grid',
  onViewModeChange,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  const hasActiveFilters = Boolean(
    selectedAgent !== 'ALL' ||
    selectedCategory !== 'ALL' ||
    searchQuery.trim() !== '' ||
    openSourceOnly ||
    recipeOnly ||
    likesOnly
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      id="gallery-filter"
      className="max-w-6xl mx-auto scroll-mt-24 px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-7 space-y-7"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-[var(--hairline)] pb-5">
        <div className="flex items-baseline gap-4">
          <h2 className="m-0 font-editorial text-[30px] sm:text-[36px] font-normal leading-none tracking-[-0.025em] text-[var(--ink)]">
            作品索引
          </h2>
          <span className="text-[10px] font-medium tracking-[0.18em] text-[var(--graphite)]">
            CURATED INDEX
          </span>
        </div>
        <div className="flex items-center gap-3">
          <p className="m-0 text-[11px] tracking-[0.08em] text-[var(--graphite)]">
            当前目录 <span className="num-tabular ml-2 text-sm text-[var(--ink)]">{resultCount}</span> 件作品
          </p>
          {hasActiveFilters && onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              aria-label="重置所有筛选"
              title="重置全部筛选条件"
              className="inline-flex cursor-pointer items-center gap-1 rounded-[3px] border border-[var(--hairline)] bg-[var(--paper-raised)] px-2 py-0.5 font-mono text-[11px] text-[var(--vermilion)] transition-colors hover:border-[var(--vermilion)] hover:bg-[rgba(200,71,50,0.06)]"
            >
              <RotateCcw className="h-3 w-3" />
              <span>重置条件</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="relative min-w-0">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 stroke-[1.5] text-[var(--graphite)]"
          />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索作品名称、提示词、作者、智能体或技术栈..."
            aria-label="搜索作品"
            className="h-11 w-full rounded-[4px] border border-[var(--hairline)] bg-transparent pl-10 pr-14 text-sm text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--graphite)] hover:border-[var(--graphite)] focus:border-[var(--ink)]"
          />
          <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="清空搜索"
                title="清空搜索"
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[2px] text-[var(--graphite)] transition-colors hover:text-[var(--ink)]"
              >
                <X aria-hidden="true" className="h-4 w-4 stroke-[1.5]" />
              </button>
            ) : (
              <kbd
                title="按下 / 键聚焦搜索"
                className="hidden rounded-[2px] border border-[var(--hairline)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--graphite)] sm:inline-block select-none"
              >
                /
              </kbd>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-3 sm:gap-x-5">
          {/* Dynamic Agents Dropdown */}
          <select
            aria-label="按智能体筛选"
            value={selectedAgent}
            onChange={(event) => onSelectAgent(event.target.value)}
            className="h-11 min-w-0 flex-1 cursor-pointer rounded-[4px] border border-[var(--hairline)] bg-[var(--paper-raised)] px-3 text-xs text-[var(--ink)] outline-none transition-colors hover:border-[var(--graphite)] focus:border-[var(--ink)] sm:min-w-[150px] sm:flex-none"
          >
            <option value="ALL">全部智能体</option>
            {availableAgents.map((tool) => (
              <option key={tool} value={tool}>
                {tool}
              </option>
            ))}
          </select>

          {/* Sort Order Selector */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-[var(--graphite)]" aria-hidden="true" />
            <select
              aria-label="作品排序"
              value={sortBy}
              onChange={(event) => onSortChange(event.target.value as SortOption)}
              className="h-11 cursor-pointer rounded-[4px] border border-[var(--hairline)] bg-[var(--paper-raised)] px-2.5 text-xs text-[var(--ink)] outline-none transition-colors hover:border-[var(--graphite)] focus:border-[var(--ink)]"
            >
              <option value="default">默认精选</option>
              <option value="likes">最多赞赏</option>
              <option value="stars">GitHub Stars</option>
              <option value="newest">最新收录</option>
            </select>
          </div>

          {onViewModeChange && (
            <div
              role="group"
              aria-label="视图展示形式"
              className="hidden sm:inline-flex items-center rounded-[3px] border border-[var(--hairline)] p-0.5 bg-[var(--paper-raised)]"
            >
              <button
                type="button"
                onClick={() => onViewModeChange('grid')}
                title="画廊卡片视图"
                aria-label="画廊卡片视图"
                className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-[2px] transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[var(--ink)] text-[var(--paper-raised)]'
                    : 'text-[var(--graphite)] hover:text-[var(--ink)]'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('list')}
                title="紧凑清单视图"
                aria-label="紧凑清单视图"
                className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-[2px] transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[var(--ink)] text-[var(--paper-raised)]'
                    : 'text-[var(--graphite)] hover:text-[var(--ink)]'
                }`}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            aria-pressed={openSourceOnly}
            onClick={onToggleOpenSource}
            className={`inline-flex cursor-pointer items-center gap-1.5 border-b py-2 text-xs transition-colors ${
              openSourceOnly
                ? 'border-[var(--ink)] font-medium text-[var(--ink)]'
                : 'border-transparent text-[var(--graphite)] hover:border-[var(--graphite)] hover:text-[var(--ink)]'
            }`}
          >
            <Code2 aria-hidden="true" className="h-3.5 w-3.5 stroke-[1.5]" />
            <span>开源源码</span>
          </button>

          <button
            type="button"
            aria-pressed={recipeOnly}
            onClick={onToggleRecipe}
            className={`inline-flex cursor-pointer items-center gap-1.5 border-b py-2 text-xs transition-colors ${
              recipeOnly
                ? 'border-[var(--ink)] font-medium text-[var(--ink)]'
                : 'border-transparent text-[var(--graphite)] hover:border-[var(--graphite)] hover:text-[var(--ink)]'
            }`}
          >
            <BookOpen aria-hidden="true" className="h-3.5 w-3.5 stroke-[1.5]" />
            <span>制作配方</span>
          </button>

          {onToggleLikesOnly && (
            <button
              type="button"
              aria-pressed={likesOnly}
              onClick={onToggleLikesOnly}
              className={`inline-flex cursor-pointer items-center gap-1.5 border-b py-2 text-xs transition-colors ${
                likesOnly
                  ? 'border-[var(--vermilion)] font-medium text-[var(--vermilion)]'
                  : 'border-transparent text-[var(--graphite)] hover:border-[var(--graphite)] hover:text-[var(--ink)]'
              }`}
            >
              <Heart
                aria-hidden="true"
                className={`h-3.5 w-3.5 stroke-[1.5] ${
                  likesOnly ? 'fill-[var(--vermilion)] text-[var(--vermilion)]' : ''
                }`}
              />
              <span>
                我的赞赏
                {userLikesCount > 0 && (
                  <span className="num-tabular ml-1 font-mono text-[11px]">({userLikesCount})</span>
                )}
              </span>
            </button>
          )}
        </div>
      </div>

      <nav
        aria-label="按作品分类筛选"
        className="flex items-center gap-x-5 gap-y-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:gap-x-7 sm:overflow-visible sm:pb-0"
      >
        <button
          type="button"
          aria-pressed={selectedCategory === 'ALL'}
          onClick={() => onSelectCategory('ALL')}
          className={`shrink-0 cursor-pointer border-b py-2 text-xs transition-colors ${
            selectedCategory === 'ALL'
              ? 'border-[var(--ink)] font-semibold text-[var(--ink)]'
              : 'border-transparent text-[var(--graphite)] hover:border-[var(--graphite)] hover:text-[var(--ink)]'
          }`}
        >
          全部品类
        </button>

        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectCategory(cat.id)}
              className={`shrink-0 cursor-pointer border-b py-2 text-xs transition-colors ${
                isSelected
                  ? 'border-[var(--ink)] font-semibold text-[var(--ink)]'
                  : 'border-transparent text-[var(--graphite)] hover:border-[var(--graphite)] hover:text-[var(--ink)]'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
