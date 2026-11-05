import React, { useEffect, useRef, useState } from 'react';
import type { Creation } from '../types';
import { CATEGORY_LABELS } from '../constants/category';
import { useDialogFocus } from './dialogFocus';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import {
  X,
  ExternalLink,
  Heart,
  Copy,
  Check,
  Code2,
  ArrowUpRight,
  Terminal,
  Link2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FileText,
  Maximize2,
} from 'lucide-react';
import { GithubIcon, XIcon } from './Icons';
import { triggerLikeConfetti } from '../utils/confetti';
import { VideoPlayer } from './VideoPlayer';
import { SharePosterModal } from './SharePosterModal';

interface CreationDetailModalProps {
  creation: Creation | null;
  onClose: () => void;
  isLiked: boolean;
  onLike: (id: string, e: React.MouseEvent) => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  currentIndex?: number;
  totalCount?: number;
}

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';

const ensureExternalUrl = (url?: string) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

export const CreationDetailModal: React.FC<CreationDetailModalProps> = ({
  creation,
  onClose,
  isLiked,
  onLike,
  onNavigate,
  currentIndex,
  totalCount,
}) => {
  useBodyScrollLock(Boolean(creation));

  useEffect(() => {
    if (!creation) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.getAttribute('role') === 'tab';
      if (!isInput && onNavigate) {
        if (event.key === 'ArrowLeft') onNavigate('prev');
        if (event.key === 'ArrowRight') onNavigate('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [creation, onClose, onNavigate]);

  if (!creation) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-6">
      <div
        role="presentation"
        onClick={onClose}
        className="fixed inset-0 bg-[rgba(23,23,20,0.58)] backdrop-blur-[10px]"
      />

      <DetailSheet
        key={creation.id}
        creation={creation}
        isLiked={isLiked}
        onLike={onLike}
        onClose={onClose}
        onNavigate={onNavigate}
        currentIndex={currentIndex}
        totalCount={totalCount}
      />
    </div>
  );
};

const DetailSheet: React.FC<{
  creation: Creation;
  isLiked: boolean;
  onLike: (id: string, e: React.MouseEvent) => void;
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  currentIndex?: number;
  totalCount?: number;
}> = ({ creation, isLiked, onLike, onClose, onNavigate, currentIndex, totalCount }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'recipe' | 'code'>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyTimer = useRef<number | undefined>(undefined);
  const dialogRef = useRef<HTMLElement | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const codeLines = creation.openSource.codeSnippet?.code.split('\n') ?? [];

  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const linkCopyTimer = useRef<number | undefined>(undefined);
  const [isPosterOpen, setIsPosterOpen] = useState(false);

  useDialogFocus(dialogRef);
  useEffect(() => () => {
    window.clearTimeout(copyTimer.current);
    window.clearTimeout(linkCopyTimer.current);
  }, []);

  const handleCopy = (text: string, key: string) => {
    window.clearTimeout(copyTimer.current);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      copyTimer.current = window.setTimeout(() => setCopiedKey(null), 2000);
    }).catch(() => setCopiedKey(null));
  };

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?id=${creation.id}`;
    window.clearTimeout(linkCopyTimer.current);
    navigator.clipboard.writeText(url).then(() => {
      setIsLinkCopied(true);
      linkCopyTimer.current = window.setTimeout(() => setIsLinkCopied(false), 2000);
    }).catch(() => setIsLinkCopied(false));
  };

  const handleShareCreationToX = () => {
    const text = encodeURIComponent(
      `在 @xiedongznq 的展馆发现了一款基于 ${creation.agentTool} 打造的精选造物「${creation.title}」！附带制作配方与源码：`
    );
    const url = encodeURIComponent(
      `${window.location.origin}${window.location.pathname}?id=${creation.id}`
    );
    window.open(`https://x.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleModalLike = (e: React.MouseEvent) => {
    if (!isLiked) {
      triggerLikeConfetti(e.clientX, e.clientY);
    }
    onLike(creation.id, e);
  };

  const tabs = [
    { id: 'overview' as const, label: '作品概览' },
    { id: 'recipe' as const, label: '制作配方' },
    { id: 'code' as const, label: '开源代码' },
  ];
  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);

  const moveTab = (nextIndex: number) => {
    const next = tabs[(nextIndex + tabs.length) % tabs.length];
    setActiveTab(next.id);
    tabRefs.current[(nextIndex + tabs.length) % tabs.length]?.focus();
  };

  return (
    <section
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="creation-detail-title"
      className="relative z-10 mx-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[1100px] flex-col overflow-hidden rounded-[4px] border border-[var(--hairline)] bg-[var(--paper-raised)] shadow-[0_28px_80px_-32px_rgba(23,23,20,0.32)] sm:max-h-[calc(100dvh-3rem)]"
    >
      <div className="flex items-center justify-between gap-4 border-b border-[var(--hairline)] px-5 py-4 sm:px-7">
        <div className="min-w-0">
          <p className="m-0 truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--graphite)]">
            {creation.agentTool}
          </p>
          <h2 id="creation-detail-title" className="mt-2 truncate text-base font-semibold text-[var(--ink)]">
            {creation.title}
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {onNavigate && totalCount !== undefined && totalCount > 1 && (
            <div className="flex items-center gap-1 border-r border-[var(--hairline)] pr-2">
              <span className="hidden font-mono text-[11px] text-[var(--graphite)] select-none mr-1.5 num-tabular sm:inline">
                {String((currentIndex ?? 0) + 1).padStart(2, '0')} / {String(totalCount).padStart(2, '0')}
              </span>
              <button
                type="button"
                onClick={() => onNavigate('prev')}
                title="上一个作品 (← 键盘左键)"
                aria-label="上一个作品"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[3px] border border-[var(--hairline)] text-[var(--graphite)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('next')}
                title="下一个作品 (→ 键盘右键)"
                aria-label="下一个作品"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[3px] border border-[var(--hairline)] text-[var(--graphite)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsPosterOpen(true)}
            aria-label="生成作品分享海报"
            title="生成作品分享海报"
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[3px] border border-[var(--hairline)] px-2.5 text-xs text-[var(--graphite)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)]"
          >
            <Sparkles className="h-3.5 w-3.5 text-[var(--vermilion)]" />
            <span className="hidden sm:inline">生成海报</span>
          </button>

          <button
            type="button"
            onClick={handleCopyShareLink}
            aria-label="复制作品直达链接"
            title="复制直达链接"
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[3px] border border-[var(--hairline)] px-2.5 text-xs text-[var(--graphite)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)]"
          >
            {isLinkCopied ? (
              <>
                <Check className="h-3.5 w-3.5 text-[var(--vermilion)]" />
                <span className="hidden sm:inline">已复制</span>
              </>
            ) : (
              <>
                <Link2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">复制直链</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleShareCreationToX}
            aria-label="在 X 分享此作品"
            title="分享至 X"
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[3px] border border-[var(--hairline)] px-2.5 text-xs text-[var(--graphite)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)]"
          >
            <XIcon className="h-3 w-3" />
            <span className="hidden sm:inline">推送到 X</span>
          </button>

          <button
            type="button"
            onClick={handleModalLike}
            aria-pressed={isLiked}
            aria-label={isLiked ? `取消点赞${creation.title}` : `点赞${creation.title}`}
            className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-[3px] border px-3 text-xs transition-colors ${
              isLiked
                ? 'border-[var(--vermilion)] text-[var(--vermilion)]'
                : 'border-[var(--hairline)] text-[var(--graphite)] hover:border-[var(--graphite)] hover:text-[var(--ink)]'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-[var(--vermilion)]' : ''}`} />
            <span className="num-tabular">{creation.stats.likes}</span>
          </button>

          <button
            type="button"
            data-autofocus
            onClick={onClose}
            aria-label="关闭"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[3px] text-[var(--graphite)] transition-colors hover:bg-[rgba(23,23,20,0.06)] hover:text-[var(--ink)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="border-b border-[var(--hairline)] px-5 sm:px-7">
        <div role="tablist" aria-label="作品详情页签" className="flex gap-6 overflow-x-auto">
          {tabs.map((tab, idx) => (
            <button
              key={tab.id}
              id={`detail-tab-${tab.id}`}
              ref={(node) => { tabRefs.current[idx] = node; }}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls="detail-panel"
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight') moveTab(activeIndex + 1);
                if (event.key === 'ArrowLeft') moveTab(activeIndex - 1);
              }}
              className={`shrink-0 cursor-pointer border-b-2 py-3 text-xs transition-colors ${
                activeTab === tab.id
                  ? 'border-[var(--ink)] font-semibold text-[var(--ink)]'
                  : 'border-transparent text-[var(--graphite)] hover:border-[var(--graphite)] hover:text-[var(--ink)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div id="detail-panel" role="tabpanel" tabIndex={0} aria-labelledby={`detail-tab-${activeTab}`} className="flex-1 overflow-y-auto px-5 py-6 sm:px-7 sm:py-8">
        {activeTab === 'overview' && <OverviewTab creation={creation} />}
        {activeTab === 'recipe' && (
          <RecipeTab creation={creation} copiedKey={copiedKey} onCopy={handleCopy} />
        )}
        {activeTab === 'code' && (
          <CodeTab creation={creation} codeLines={codeLines} copiedKey={copiedKey} onCopy={handleCopy} />
        )}
      </div>

      <SharePosterModal
        creation={creation}
        isOpen={isPosterOpen}
        onClose={() => setIsPosterOpen(false)}
      />
    </section>
  );
};

function formatRecipeMarkdown(creation: Creation): string {
  let md = `# ${creation.title}\n\n`;
  md += `> **核心智能体**: ${creation.agentTool} | **创作者**: ${creation.author.name} (${creation.author.handle})\n\n`;
  md += `**一句话介绍**: ${creation.tagline || creation.description}\n\n`;
  md += `**技术底座**: ${creation.recipe.toolsUsed.join(' · ')}\n\n`;

  if (creation.recipe.systemPrompt) {
    md += `## System Prompt (核心设定)\n\`\`\`text\n${creation.recipe.systemPrompt}\n\`\`\`\n\n`;
  }

  if (creation.recipe.keyPrompts.length > 0) {
    md += `## 关键迭代提示词\n\n`;
    creation.recipe.keyPrompts.forEach((p, idx) => {
      md += `### ${idx + 1}. ${p.title}\n\`\`\`text\n${p.prompt}\n\`\`\`\n\n`;
    });
  }

  if (creation.recipe.workflowSteps.length > 0) {
    md += `## 制作推演步骤\n\n`;
    creation.recipe.workflowSteps.forEach((step, idx) => {
      md += `${idx + 1}. ${step}\n`;
    });
    md += `\n`;
  }

  if (creation.recipe.lessonsLearned.length > 0) {
    md += `## 经验与总结\n\n`;
    creation.recipe.lessonsLearned.forEach((lesson) => {
      md += `- ${lesson}\n`;
    });
    md += `\n`;
  }

  if (creation.openSource.isAvailable && creation.openSource.githubUrl) {
    md += `## 开源仓库\n${creation.openSource.githubUrl}\n\n`;
  }

  md += `---\n*收录于 @xiedongznq 智能体时代的真实造物展馆 (AgentCraft)*\n`;
  return md;
}

const OverviewTab: React.FC<{ creation: Creation }> = ({ creation }) => {
  const [coverSrc, setCoverSrc] = useState(creation.media.coverImage || FALLBACK_COVER);
  const [avatarSrc, setAvatarSrc] = useState(creation.author.avatar || FALLBACK_AVATAR);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        e.preventDefault();
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc, true);
    return () => window.removeEventListener('keydown', handleEsc, true);
  }, [isLightboxOpen]);

  return (
    <>
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)] lg:gap-9">
        <div className="min-w-0 space-y-5">
          <div className="group relative overflow-hidden rounded-[3px] border border-[var(--hairline)] bg-[rgba(23,23,20,0.04)]">
            {creation.media.videoUrl ? (
              <VideoPlayer
                url={creation.media.videoUrl}
                fallbackCover={coverSrc}
                title={creation.title}
              />
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsLightboxOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setIsLightboxOpen(true);
                }}
                title="点击放大查看视觉展示图"
                className="relative cursor-zoom-in"
              >
                <img
                  src={coverSrc}
                  alt={creation.title}
                  onError={() => setCoverSrc(FALLBACK_COVER)}
                  className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-[1.015]"
                />
                <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-[2px] border border-[var(--hairline)] bg-[var(--paper-raised)] px-2 py-1 text-[11px] font-medium text-[var(--ink)] opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                  <Maximize2 className="h-3 w-3" />
                  <span>放大预览</span>
                </span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold leading-snug text-[var(--ink)] sm:text-2xl">{creation.title}</h3>
            <p className="text-sm leading-7 text-[var(--graphite)]">{creation.description}</p>
          </div>

          {creation.media.liveUrl && (
            <a
              href={ensureExternalUrl(creation.media.liveUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex w-fit"
            >
              <span>访问在线演示</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        <aside className="min-w-0 border-t border-[var(--hairline)] pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--graphite)]">创作者</p>
          <div className="mt-5 flex items-start gap-4">
            <img
              src={avatarSrc}
              alt={creation.author.name}
              onError={() => setAvatarSrc(FALLBACK_AVATAR)}
              className="h-12 w-12 shrink-0 rounded-full border border-[var(--hairline)] object-cover"
            />
            <div className="min-w-0">
              <h4 className="m-0 text-sm font-semibold text-[var(--ink)]">{creation.author.name}</h4>
              <p className="m-0 mt-1 font-mono text-xs text-[var(--graphite)]">{creation.author.handle}</p>
              {creation.author.bio && (
                <p className="m-0 mt-3 text-xs leading-6 text-[var(--graphite)]">{creation.author.bio}</p>
              )}
            </div>
          </div>

          <a
            href={ensureExternalUrl(creation.author.xUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary mt-6 inline-flex w-full justify-center"
          >
            <XIcon className="h-3.5 w-3.5" />
            <span>在 X 关注作者</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>

          <dl className="mt-7 space-y-4 border-t border-[var(--hairline)] pt-5 text-xs">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--graphite)]">核心智能体</dt>
              <dd className="m-0 text-right font-medium text-[var(--ink)]">{creation.agentTool}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--graphite)]">社区赞赏</dt>
              <dd className="m-0 num-tabular text-[var(--ink)]">{creation.stats.likes}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--graphite)]">收录日期</dt>
              <dd className="m-0 num-tabular text-[var(--ink)]">{creation.stats.createdAt}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--graphite)]">作品分类</dt>
              <dd className="m-0 text-right text-[var(--ink)]">
                {CATEGORY_LABELS[creation.category] ?? creation.category}
              </dd>
            </div>
          </dl>
        </aside>
      </div>

      {isLightboxOpen && (
        <div
          role="dialog"
          aria-label="大图视觉展示"
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="relative max-h-[92vh] max-w-[92vw] overflow-hidden rounded-[4px] shadow-2xl">
            <img
              src={coverSrc}
              alt={creation.title}
              className="max-h-[88vh] max-w-[90vw] object-contain"
            />
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              aria-label="关闭大图预览"
              className="absolute top-3 right-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/90"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const RecipeTab: React.FC<{
  creation: Creation;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
}> = ({ creation, copiedKey, onCopy }) => {
  const fullMarkdown = formatRecipeMarkdown(creation);
  const [isZenPromptOpen, setIsZenPromptOpen] = useState(false);

  useEffect(() => {
    if (!isZenPromptOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        e.preventDefault();
        setIsZenPromptOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc, true);
    return () => window.removeEventListener('keydown', handleEsc, true);
  }, [isZenPromptOpen]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[3px] border border-[var(--hairline)] bg-[rgba(23,23,20,0.025)] p-3.5 sm:p-4">
        <div>
          <h4 className="m-0 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink)]">
            AI 提示词与制作配方
          </h4>
          <p className="m-0 mt-0.5 text-xs text-[var(--graphite)]">
            一键将整套完整配方复制为 Markdown，可直接投喂给 Claude Code、Cursor 或 ChatGPT
          </p>
        </div>

        <button
          type="button"
          onClick={() => onCopy(fullMarkdown, 'full-recipe-md')}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-[3px] border border-[var(--ink)] bg-[var(--ink)] px-3 py-1.5 text-xs font-medium text-[var(--paper-raised)] transition-opacity hover:opacity-90"
        >
          {copiedKey === 'full-recipe-md' ? (
            <>
              <Check className="h-3.5 w-3.5 text-[var(--vermilion)]" />
              <span>已复制完整 Markdown</span>
            </>
          ) : (
            <>
              <FileText className="h-3.5 w-3.5" />
              <span>复制完整配方 (Markdown)</span>
            </>
          )}
        </button>
      </div>

      <section>
        <SectionTitle>核心技术底座</SectionTitle>
        <p className="mt-4 text-sm leading-7 text-[var(--graphite)]">
          {creation.recipe.toolsUsed.join(' · ')}
        </p>
      </section>

      {creation.recipe.systemPrompt && (
        <section className="border-t border-[var(--hairline)] pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <SectionTitle>System Prompt (核心设定)</SectionTitle>
              <span className="font-mono text-[10px] text-[var(--graphite)] bg-[rgba(23,23,20,0.04)] px-1.5 py-0.5 rounded-[2px]">
                ~{Math.round(creation.recipe.systemPrompt.length / 3.5)} tokens · {creation.recipe.systemPrompt.length} 字符
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsZenPromptOpen(true)}
                className="inline-flex cursor-pointer items-center gap-1 border-b border-[var(--hairline)] pb-0.5 text-xs text-[var(--graphite)] hover:border-[var(--ink)] hover:text-[var(--ink)]"
              >
                <Maximize2 className="h-3 w-3" />
                <span>全屏专注模式</span>
              </button>
              <CopyButton
                copied={copiedKey === 'sys'}
                onClick={() => onCopy(creation.recipe.systemPrompt!, 'sys')}
                label="复制 System Prompt"
              />
            </div>
          </div>
          <pre className="mt-4 max-h-[360px] overflow-x-auto overflow-y-auto whitespace-pre-wrap rounded-[3px] border border-[var(--hairline)] bg-[rgba(23,23,20,0.025)] p-4 font-mono text-xs leading-6 text-[var(--ink)]">
            {creation.recipe.systemPrompt}
          </pre>
        </section>
      )}

      {isZenPromptOpen && creation.recipe.systemPrompt && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[75] flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-md"
          onClick={() => setIsZenPromptOpen(false)}
        >
          <div
            className="relative flex flex-col max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[4px] border border-[var(--hairline)] bg-[var(--paper-raised)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--hairline)] px-6 py-4">
              <div className="flex items-center gap-3">
                <h3 className="m-0 text-sm font-semibold text-[var(--ink)]">
                  {creation.title} · 核心 System Prompt 专注阅读
                </h3>
                <span className="font-mono text-xs text-[var(--graphite)]">
                  ~{Math.round(creation.recipe.systemPrompt.length / 3.5)} tokens
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CopyButton
                  copied={copiedKey === 'sys-zen'}
                  onClick={() => onCopy(creation.recipe.systemPrompt!, 'sys-zen')}
                  label="复制"
                />
                <button
                  type="button"
                  onClick={() => setIsZenPromptOpen(false)}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[3px] text-[var(--graphite)] hover:text-[var(--ink)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm leading-relaxed text-[var(--ink)]">
                {creation.recipe.systemPrompt}
              </pre>
            </div>
          </div>
        </div>
      )}

    {creation.recipe.keyPrompts.length > 0 && (
      <section className="border-t border-[var(--hairline)] pt-6">
        <SectionTitle>关键迭代提示词</SectionTitle>
        <div className="mt-5 space-y-5">
          {creation.recipe.keyPrompts.map((item, idx) => (
            <div key={`${item.title}-${idx}`}>
              <div className="flex items-center justify-between gap-4">
                <h4 className="m-0 text-sm font-semibold text-[var(--ink)]">{item.title}</h4>
                <CopyButton
                  copied={copiedKey === `prompt-${idx}`}
                  onClick={() => onCopy(item.prompt, `prompt-${idx}`)}
                  label={`复制${item.title}`}
                />
              </div>
              <p className="mt-2 whitespace-pre-wrap border-l-2 border-[var(--hairline)] pl-4 font-mono text-xs leading-6 text-[var(--graphite)]">
                {item.prompt}
              </p>
            </div>
          ))}
        </div>
      </section>
    )}

    {creation.recipe.workflowSteps.length > 0 && (
      <section className="border-t border-[var(--hairline)] pt-6">
        <SectionTitle>制作推演步骤</SectionTitle>
        <ol className="mt-4 space-y-3 text-sm leading-6 text-[var(--graphite)]">
          {creation.recipe.workflowSteps.map((step, idx) => (
            <li key={`${step}-${idx}`} className="flex gap-4">
              <span className="num-tabular shrink-0 font-mono text-xs text-[var(--ink)]">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>
    )}

    {creation.recipe.lessonsLearned.length > 0 && (
      <section className="border-t border-[var(--hairline)] pt-6">
        <SectionTitle>经验与总结</SectionTitle>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-[var(--graphite)]">
          {creation.recipe.lessonsLearned.map((lesson, idx) => <li key={`${lesson}-${idx}`}>{lesson}</li>)}
        </ul>
      </section>
    )}
  </div>
  );
};

const CodeTab: React.FC<{
  creation: Creation;
  codeLines: string[];
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
}> = ({ creation, codeLines, copiedKey, onCopy }) => {
  if (!creation.openSource.isAvailable) {
    return (
      <div className="border-t border-[var(--hairline)] py-14 text-center">
        <Code2 className="mx-auto h-7 w-7 text-[var(--graphite)]" />
        <h3 className="mt-4 text-base font-semibold text-[var(--ink)]">暂未开放完整仓库</h3>
        <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-[var(--graphite)]">
          作者已在制作配方中公开核心设定与提示词，可直接按配方复刻。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-4 border-t border-[var(--hairline)] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[3px] bg-[var(--ink)]">
            <GithubIcon className="h-4 w-4 text-[var(--paper-raised)]" />
          </div>
          <div>
            <h3 className="m-0 text-sm font-semibold text-[var(--ink)]">开源代码仓库</h3>
            <p className="m-0 mt-1 text-xs text-[var(--graphite)]">
              {creation.openSource.license ?? 'MIT'} · 前往 GitHub 查阅完整源码
            </p>
          </div>
        </div>

        <a
          href={ensureExternalUrl(creation.openSource.githubUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-flex w-fit"
        >
          <span>查看仓库</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </section>

      {creation.openSource.githubUrl && (
        <section className="rounded-[3px] border border-[var(--hairline)] bg-[rgba(23,23,20,0.03)] p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-mono text-xs text-[var(--graphite)]">
              <Terminal className="h-3.5 w-3.5 text-[var(--ink)]" />
              <span>克隆此仓库</span>
            </div>
            <CopyButton
              copied={copiedKey === 'git-clone'}
              onClick={() =>
                onCopy(`git clone ${creation.openSource.githubUrl}.git`, 'git-clone')
              }
              label="复制克隆指令"
            />
          </div>
          <p className="m-0 mt-2 font-mono text-xs text-[var(--ink)]">
            git clone {creation.openSource.githubUrl}.git
          </p>
        </section>
      )}

      {creation.openSource.codeSnippet && (
        <section className="overflow-hidden rounded-[3px] border border-[var(--hairline)] bg-[#171714]">
          <div className="flex items-center justify-between gap-4 border-b border-[rgba(244,241,234,0.12)] px-4 py-3">
            <span className="truncate font-mono text-xs text-[rgba(244,241,234,0.62)]">
              {creation.openSource.codeSnippet.filename}
            </span>
            <CopyButton
              dark
              copied={copiedKey === 'code-snippet'}
              onClick={() => onCopy(creation.openSource.codeSnippet!.code, 'code-snippet')}
              label="复制代码片段"
            />
          </div>

          <div className="flex overflow-x-auto p-4 font-mono text-xs leading-6">
            <div aria-hidden="true" className="select-none pr-4 text-right text-[rgba(244,241,234,0.32)]">
              {codeLines.map((_, idx) => <div key={idx}>{idx + 1}</div>)}
            </div>
            <pre className="m-0 border-l border-[rgba(244,241,234,0.12)] pl-4 text-[rgba(244,241,234,0.86)]">
              <code>{creation.openSource.codeSnippet.code}</code>
            </pre>
          </div>
        </section>
      )}
    </div>
  );
};

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--graphite)]">{children}</h3>
);

const CopyButton: React.FC<{
  copied: boolean;
  dark?: boolean;
  label: string;
  onClick: () => void;
}> = ({ copied, dark = false, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className={`inline-flex cursor-pointer items-center gap-1.5 border-b pb-0.5 text-xs transition-colors ${
      dark
        ? 'border-[rgba(244,241,234,0.22)] text-[rgba(244,241,234,0.72)] hover:border-[var(--paper)] hover:text-[var(--paper)]'
        : 'border-[var(--hairline)] text-[var(--graphite)] hover:border-[var(--ink)] hover:text-[var(--ink)]'
    }`}
  >
    {copied ? <Check className="h-3.5 w-3.5 text-[var(--vermilion)]" /> : <Copy className="h-3.5 w-3.5" />}
    <span>{copied ? '已复制' : '复制'}</span>
  </button>
);
