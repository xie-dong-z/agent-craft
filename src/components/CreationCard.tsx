import React, { useState } from 'react';
import type { Creation } from '../types';
import { CATEGORY_LABELS } from '../constants/category';
import { Heart, ExternalLink, BookOpen, Star } from 'lucide-react';
import { GithubIcon, XIcon } from './Icons';
import { triggerLikeConfetti } from '../utils/confetti';

interface CreationCardProps {
  index: number;
  creation: Creation;
  isLiked: boolean;
  onLike: (id: string, e: React.MouseEvent) => void;
  onClick: (creation: Creation) => void;
  onFilterAgent?: (agent: string) => void;
  onFilterCategory?: (category: import('../types').Category) => void;
}

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=75';
const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=75';

const getThumbnailUrl = (url: string) => {
  if (!url) return FALLBACK_COVER;
  if (url.includes('images.unsplash.com')) {
    return url.replace(/w=\d+/, 'w=600').replace(/q=\d+/, 'q=75');
  }
  return url;
};

const ensureExternalUrl = (url?: string) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

export const CreationCard: React.FC<CreationCardProps> = ({
  index,
  creation,
  isLiked,
  onLike,
  onClick,
  onFilterAgent,
  onFilterCategory,
}) => {
  const [imgSrc, setImgSrc] = useState(() => getThumbnailUrl(creation.media.coverImage));
  const [avatarSrc, setAvatarSrc] = useState(creation.author.avatar);
  const [isImgLoaded, setIsImgLoaded] = useState(false);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLiked) {
      triggerLikeConfetti(e.clientX, e.clientY);
    }
    onLike(creation.id, e);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      // Don't hijack if user is pressing enter/space on an inner button or link
      if ((e.target as HTMLElement).tagName.toLowerCase() === 'article') {
        e.preventDefault();
        onClick(creation);
      }
    }
  };

  return (
    <article
      tabIndex={0}
      role="button"
      aria-label={`查看作品详情：${creation.title}`}
      onKeyDown={handleKeyDown}
      onClick={() => onClick(creation)}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-[4px] border border-[var(--hairline)] bg-[var(--paper)] outline-none transition-all duration-200 hover:border-[var(--graphite)] hover:shadow-[0_8px_24px_-12px_rgba(23,23,20,0.12)] focus-visible:border-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[var(--vermilion)]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-[var(--hairline)] bg-[rgba(23,23,20,0.04)]">
        {!isImgLoaded && (
          <div className="absolute inset-0 animate-pulse bg-[rgba(23,23,20,0.06)]" />
        )}
        <img
          src={imgSrc}
          alt={creation.title}
          loading="lazy"
          onLoad={() => setIsImgLoaded(true)}
          onError={() => {
            setImgSrc(FALLBACK_COVER);
            setIsImgLoaded(true);
          }}
          className={`h-full w-full object-cover object-center transition-all duration-500 ease-out group-hover:scale-[1.02] ${
            isImgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <div className="pointer-events-none absolute bottom-3 right-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
          <span className="inline-flex items-center gap-1.5 rounded-[2px] border border-[var(--hairline)] bg-[var(--paper-raised)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--ink)] shadow-sm">
            <BookOpen aria-hidden="true" className="h-3 w-3 stroke-[1.5]" />
            <span>详情与配方</span>
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <span className="num-tabular font-editorial text-[28px] leading-none text-[var(--ink)]">
            {String(index).padStart(2, '0')}
          </span>
          <p className="m-0 pt-0.5 text-right text-[10px] uppercase leading-relaxed tracking-[0.09em] text-[var(--graphite)]">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFilterAgent?.(creation.agentTool);
              }}
              title={`按智能体筛选：${creation.agentTool}`}
              className="cursor-pointer transition-colors hover:text-[var(--ink)] hover:underline underline-offset-2"
            >
              {creation.agentTool}
            </button>{' '}
            <span aria-hidden="true">/</span>{' '}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFilterCategory?.(creation.category);
              }}
              title={`按分类筛选：${CATEGORY_LABELS[creation.category] ?? creation.category}`}
              className="cursor-pointer transition-colors hover:text-[var(--ink)] hover:underline underline-offset-2"
            >
              {CATEGORY_LABELS[creation.category] ?? creation.category}
            </button>
          </p>
        </div>

        <div className="mt-4 space-y-2">
          <h3
            id={`creation-title-${creation.id}`}
            className="h-[52px] line-clamp-2 text-[19px] sm:text-[20px] font-semibold leading-snug tracking-[-0.015em] text-[var(--ink)] transition-colors group-hover:text-[var(--vermilion-text)]"
          >
            {creation.title}
          </h3>
          <p className="h-[38px] line-clamp-2 text-[12.5px] sm:text-[13px] leading-relaxed text-[var(--graphite)]">
            {creation.tagline || creation.description}
          </p>
        </div>

        <div className="mt-5 flex flex-1 flex-col justify-end space-y-3">
          <div className="flex items-center gap-2 text-[11px] text-[var(--graphite)]">
            {creation.openSource.isAvailable ? (
              creation.openSource.githubUrl ? (
                <a
                  href={ensureExternalUrl(creation.openSource.githubUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title="在 GitHub 查看开源源码"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--ink)] hover:underline"
                >
                  <GithubIcon className="h-3.5 w-3.5" />
                  <span>开源源码</span>
                  {creation.openSource.stars !== undefined && (
                    <span className="inline-flex items-center gap-1">
                      <span aria-hidden="true">·</span>
                      <Star aria-hidden="true" className="h-3 w-3 stroke-[1.5]" />
                      <span className="num-tabular">{creation.openSource.stars}</span>
                    </span>
                  )}
                </a>
              ) : (
                <>
                  <GithubIcon className="h-3.5 w-3.5" />
                  <span>开源源码</span>
                  {creation.openSource.stars !== undefined && (
                    <span className="inline-flex items-center gap-1">
                      <span aria-hidden="true">·</span>
                      <Star aria-hidden="true" className="h-3 w-3 stroke-[1.5]" />
                      <span className="num-tabular">{creation.openSource.stars}</span>
                    </span>
                  )}
                </>
              )
            ) : (
              <span>未开放源码</span>
            )}
          </div>

          <p className="line-clamp-1 text-[11px] leading-relaxed text-[var(--graphite)]">
            {creation.recipe.toolsUsed.slice(0, 3).join(' · ')}
            {creation.recipe.toolsUsed.length > 3 && ` · +${creation.recipe.toolsUsed.length - 3}`}
          </p>

          <div className="flex items-center justify-between gap-3 border-t border-[var(--hairline)] pt-3">
            <a
              href={ensureExternalUrl(creation.author.xUrl)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              aria-label={`在 X 查看${creation.author.name}`}
              title={`在 X 查看${creation.author.name}`}
              className="flex min-w-0 items-center gap-2 rounded-[2px] transition-opacity hover:opacity-70"
            >
              <img
                src={avatarSrc}
                alt={creation.author.name}
                onError={() => setAvatarSrc(FALLBACK_AVATAR)}
                className="h-6 w-6 shrink-0 rounded-full border border-[var(--hairline)] object-cover"
              />
              <span className="truncate text-xs font-medium text-[var(--ink)]">
                {creation.author.name}
              </span>
              <XIcon className="h-2.5 w-2.5 shrink-0 text-[var(--graphite)]" />
            </a>

            <div className="flex shrink-0 items-center gap-2">
              {creation.media.liveUrl && (
                <a
                  href={ensureExternalUrl(creation.media.liveUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`访问${creation.title}在线体验`}
                  title="访问在线体验"
                  className="flex h-8 w-8 items-center justify-center rounded-[2px] text-[var(--graphite)] transition-colors hover:text-[var(--ink)]"
                >
                  <ExternalLink aria-hidden="true" className="h-4 w-4 stroke-[1.5]" />
                </a>
              )}

              <button
                type="button"
                onClick={handleLikeClick}
                aria-label={isLiked ? `取消点赞${creation.title}` : `点赞${creation.title}`}
                aria-pressed={isLiked}
                title={isLiked ? '取消赞赏' : '为作者赞赏'}
                className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[2px] px-1.5 text-xs transition-colors ${
                  isLiked
                    ? 'text-[var(--vermilion)]'
                    : 'text-[var(--graphite)] hover:text-[var(--ink)]'
                }`}
              >
                <Heart
                  aria-hidden="true"
                  className={`h-4 w-4 stroke-[1.75] transition-transform active:scale-125 ${
                    isLiked ? 'fill-[var(--vermilion)]' : ''
                  }`}
                />
                <span className="num-tabular text-[11px]">{creation.stats.likes}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
