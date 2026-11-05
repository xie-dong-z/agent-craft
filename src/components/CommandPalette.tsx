import React, { useState, useEffect, useRef } from 'react';
import type { Creation } from '../types';
import { SITE_CONFIG } from '../constants/siteConfig';
import { CATEGORY_LABELS } from '../constants/category';
import {
  Search,
  ArrowRight,
  Sparkles,
  Feather,
  Plus,
  Heart,
  Download,
  ExternalLink,
  Code2,
} from 'lucide-react';
import { useDialogFocus } from './dialogFocus';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  creations: Creation[];
  onSelectCreation: (creation: Creation) => void;
  onOpenSubmit: () => void;
  aestheticMode: 'ink' | 'chromatic';
  onToggleAesthetic: () => void;
  onToggleLikesOnly: () => void;
  onExportData: () => void;
}

interface CommandAction {
  id: string;
  type: 'action';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  handler: () => void;
}

interface CommandCreation {
  id: string;
  type: 'creation';
  title: string;
  subtitle: string;
  creation: Creation;
}

type CommandItem = CommandAction | CommandCreation;

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  creations,
  onSelectCreation,
  onOpenSubmit,
  aestheticMode,
  onToggleAesthetic,
  onToggleLikesOnly,
  onExportData,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useBodyScrollLock(isOpen);
  useDialogFocus(dialogRef, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [isOpen, onClose]);

  // Define static quick actions
  const quickActions: CommandAction[] = [
    {
      id: 'action-aesthetic',
      type: 'action',
      title: aestheticMode === 'chromatic' ? '切换为墨韵雅致画卷' : '切换为炫彩极光粒子',
      subtitle: '调整展馆动态全屏背景视觉风格',
      icon: aestheticMode === 'chromatic' ? <Feather className="h-4 w-4" /> : <Sparkles className="h-4 w-4 text-[var(--vermilion)]" />,
      handler: () => {
        onToggleAesthetic();
        onClose();
      },
    },
    {
      id: 'action-submit',
      type: 'action',
      title: '提交我的真实造物 (快捷键 N)',
      subtitle: '将你亲手用 Agent 搭建的成品与配方收录入展馆',
      icon: <Plus className="h-4 w-4" />,
      handler: () => {
        onClose();
        onOpenSubmit();
      },
    },
    {
      id: 'action-likes',
      type: 'action',
      title: '快速过滤：查看我的赞赏 / 收藏',
      subtitle: '在展厅中仅呈现已点赞的项目',
      icon: <Heart className="h-4 w-4 fill-[var(--vermilion)] text-[var(--vermilion)]" />,
      handler: () => {
        onToggleLikesOnly();
        onClose();
      },
    },
    {
      id: 'action-export',
      type: 'action',
      title: '导出展馆造物数据 (JSON)',
      subtitle: '离线下载完整提示词配方与项目仓库数据',
      icon: <Download className="h-4 w-4" />,
      handler: () => {
        onExportData();
        onClose();
      },
    },
    {
      id: 'action-host',
      type: 'action',
      title: `访问策展人 ${SITE_CONFIG.host.name} (${SITE_CONFIG.host.handle}) 的 X 官方主页`,
      subtitle: '加入 X 智能体造物讨论与动态交流',
      icon: <ExternalLink className="h-4 w-4" />,
      handler: () => {
        window.open(SITE_CONFIG.host.xUrl, '_blank', 'noopener,noreferrer');
        onClose();
      },
    },
  ];

  // Filter items matching query
  const filteredCreations: CommandCreation[] = creations
    .filter((c) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.agentTool.toLowerCase().includes(q) ||
        c.author.name.toLowerCase().includes(q) ||
        c.author.handle.toLowerCase().includes(q) ||
        c.tagline.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (CATEGORY_LABELS[c.category] || '').toLowerCase().includes(q) ||
        c.recipe.toolsUsed.some((tool) => tool.toLowerCase().includes(q))
      );
    })
    .slice(0, 10)
    .map((c) => ({
      id: c.id,
      type: 'creation',
      title: c.title,
      subtitle: `${c.agentTool} · 由 ${c.author.name} 亲手交付 · ${c.tagline || c.description}`,
      creation: c,
    }));

  const filteredActions: CommandAction[] = quickActions.filter((a) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q);
  });

  const allItems: CommandItem[] = [...filteredActions, ...filteredCreations];

  // Keep selected item scrolled into view
  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll('[data-command-item]');
    if (items[selectedIndex]) {
      items[selectedIndex].scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (allItems.length > 0 ? (prev + 1) % allItems.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (allItems.length > 0 ? (prev - 1 + allItems.length) % allItems.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = allItems[selectedIndex];
      if (!current) return;
      if (current.type === 'action') {
        current.handler();
      } else {
        onSelectCreation(current.creation);
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh] sm:pt-[16vh]">
      <div
        role="presentation"
        onClick={onClose}
        className="fixed inset-0 bg-[rgba(23,23,20,0.55)] backdrop-blur-md transition-opacity"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="快捷指令与全域检索"
        className="relative z-10 flex max-h-[70vh] w-full max-w-2xl flex-col overflow-hidden rounded-[4px] border border-[var(--hairline)] bg-[var(--paper-raised)] shadow-[0_32px_96px_-24px_rgba(23,23,20,0.38)]"
      >
        <div className="flex items-center border-b border-[var(--hairline)] px-4 py-3 sm:px-5">
          <Search className="h-4 w-4 shrink-0 text-[var(--graphite)] stroke-[1.75]" />
          <input
            ref={inputRef}
            type="text"
            data-autofocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="搜索作品、智能体底座、作者或快捷指令..."
            className="ml-3.5 flex-1 bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-[var(--graphite)]"
          />
          <kbd className="rounded-[2px] border border-[var(--hairline)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--graphite)]">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto p-2">
          {allItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--graphite)]">
              未找到与 “{query}” 相关的指令或作品
            </div>
          ) : (
            <div className="space-y-1">
              {filteredActions.length > 0 && (
                <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--graphite)]">
                  快捷操作
                </div>
              )}
              {filteredActions.map((action, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={action.id}
                    data-command-item
                    type="button"
                    onClick={() => action.handler()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-[3px] px-3.5 py-2.5 text-left transition-colors ${
                      isSelected
                        ? 'bg-[var(--ink)] text-[var(--paper-raised)]'
                        : 'text-[var(--ink)] hover:bg-[rgba(23,23,20,0.04)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`shrink-0 ${isSelected ? 'text-[var(--paper-raised)]' : 'text-[var(--graphite)]'}`}>
                        {action.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="m-0 truncate text-xs font-medium">{action.title}</p>
                        <p className={`m-0 truncate text-[11px] ${isSelected ? 'opacity-70' : 'text-[var(--graphite)]'}`}>
                          {action.subtitle}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-40 ml-2" />
                  </button>
                );
              })}

              {filteredCreations.length > 0 && (
                <div className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--graphite)]">
                  展馆造物 ({filteredCreations.length})
                </div>
              )}
              {filteredCreations.map((item, idx) => {
                const overallIndex = filteredActions.length + idx;
                const isSelected = selectedIndex === overallIndex;
                return (
                  <button
                    key={item.id}
                    data-command-item
                    type="button"
                    onClick={() => {
                      onSelectCreation(item.creation);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(overallIndex)}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-[3px] px-3.5 py-2.5 text-left transition-colors ${
                      isSelected
                        ? 'bg-[var(--ink)] text-[var(--paper-raised)]'
                        : 'text-[var(--ink)] hover:bg-[rgba(23,23,20,0.04)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[2px] ${
                        isSelected ? 'bg-white/15 text-white' : 'bg-[rgba(23,23,20,0.06)] text-[var(--ink)]'
                      }`}>
                        <Code2 className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="m-0 truncate text-xs font-semibold">{item.title}</p>
                          <span className={`rounded-[2px] px-1 py-0.5 font-mono text-[9px] ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-[rgba(23,23,20,0.06)] text-[var(--graphite)]'
                          }`}>
                            {item.creation.agentTool}
                          </span>
                        </div>
                        <p className={`m-0 truncate text-[11px] ${isSelected ? 'opacity-70' : 'text-[var(--graphite)]'}`}>
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-40 ml-2" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--hairline)] bg-[var(--paper)] px-4 py-2.5 text-[11px] text-[var(--graphite)]">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono">↑</kbd> <kbd className="font-mono">↓</kbd> 切换选项
            </span>
            <span>
              <kbd className="font-mono">↵</kbd> 打开选中
            </span>
          </div>
          <span>Spotlight 快捷指令</span>
        </div>
      </div>
    </div>
  );
};
