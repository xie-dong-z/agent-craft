import React from 'react';
import type { Creation, Category } from '../types';
import { CATEGORY_LABELS } from '../constants/category';
import { Heart, ExternalLink, Star } from 'lucide-react';
import { GithubIcon } from './Icons';
import { triggerLikeConfetti } from '../utils/confetti';

interface CreationCompactListProps {
  creations: Creation[];
  userLikes: string[];
  onLike: (id: string, e: React.MouseEvent) => void;
  onOpenCreation: (creation: Creation) => void;
  onFilterAgent?: (agent: string) => void;
  onFilterCategory?: (category: Category) => void;
}

const ensureExternalUrl = (url?: string) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

export const CreationCompactList: React.FC<CreationCompactListProps> = ({
  creations,
  userLikes,
  onLike,
  onOpenCreation,
  onFilterAgent,
  onFilterCategory,
}) => {
  return (
    <div className="overflow-hidden rounded-[4px] border border-[var(--hairline)] bg-[var(--paper-raised)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[var(--hairline)] bg-[rgba(23,23,20,0.03)] font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--graphite)]">
              <th className="py-3 pl-4 pr-2 w-12 text-center">#</th>
              <th className="py-3 px-4 min-w-[240px]">作品名称与简介</th>
              <th className="py-3 px-3">核心智能体</th>
              <th className="py-3 px-3">分类</th>
              <th className="py-3 px-3 min-w-[140px]">创作者</th>
              <th className="py-3 px-3">开源代码</th>
              <th className="py-3 pr-4 pl-2 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--hairline)]">
            {creations.map((item, idx) => {
              const isLiked = userLikes.includes(item.id);

              const handleRowClick = () => {
                onOpenCreation(item);
              };

              const handleLikeClick = (e: React.MouseEvent) => {
                e.stopPropagation();
                if (!isLiked) triggerLikeConfetti(e.clientX, e.clientY);
                onLike(item.id, e);
              };

              return (
                <tr
                  key={item.id}
                  onClick={handleRowClick}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onOpenCreation(item);
                    }
                  }}
                  className="group cursor-pointer transition-colors hover:bg-[rgba(23,23,20,0.035)] focus-visible:bg-[rgba(23,23,20,0.05)] outline-none"
                >
                  <td className="py-3.5 pl-4 pr-2 text-center font-mono num-tabular text-[var(--graphite)] text-[11px]">
                    {String(idx + 1).padStart(2, '0')}
                  </td>

                  <td className="py-3.5 px-4 min-w-[240px]">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.media.coverImage}
                        alt=""
                        loading="lazy"
                        className="h-10 w-16 shrink-0 rounded-[2px] border border-[var(--hairline)] object-cover"
                      />
                      <div className="min-w-0">
                        <p className="m-0 font-semibold text-sm text-[var(--ink)] group-hover:text-[var(--vermilion-text)] transition-colors truncate">
                          {item.title}
                        </p>
                        <p className="m-0 text-[11px] text-[var(--graphite)] truncate max-w-sm">
                          {item.tagline || item.description}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFilterAgent?.(item.agentTool);
                      }}
                      className="inline-flex items-center rounded-[2px] bg-[rgba(23,23,20,0.05)] px-2 py-0.5 font-mono text-[10px] font-medium text-[var(--ink)] hover:bg-[rgba(23,23,20,0.1)] transition-colors"
                    >
                      {item.agentTool}
                    </button>
                  </td>

                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFilterCategory?.(item.category);
                      }}
                      className="text-[11px] text-[var(--graphite)] hover:text-[var(--ink)] hover:underline"
                    >
                      {CATEGORY_LABELS[item.category] ?? item.category}
                    </button>
                  </td>

                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <a
                      href={ensureExternalUrl(item.author.xUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title={`在 X 查看 ${item.author.name} (${item.author.handle})`}
                      className="inline-flex items-center gap-2 transition-opacity hover:opacity-70"
                    >
                      <img
                        src={item.author.avatar}
                        alt=""
                        className="h-5 w-5 rounded-full border border-[var(--hairline)] object-cover shrink-0"
                      />
                      <span className="truncate text-xs text-[var(--ink)] font-medium">
                        {item.author.name}
                      </span>
                    </a>
                  </td>

                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {item.openSource.isAvailable && item.openSource.githubUrl ? (
                      <a
                        href={ensureExternalUrl(item.openSource.githubUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="在 GitHub 查看开源代码"
                        className="inline-flex items-center gap-1.5 text-[11px] text-[var(--graphite)] font-mono transition-colors hover:text-[var(--ink)] hover:underline"
                      >
                        <GithubIcon className="h-3 w-3" />
                        {item.openSource.stars !== undefined ? (
                          <span className="inline-flex items-center gap-0.5">
                            <Star className="h-3 w-3" />
                            <span className="num-tabular">{item.openSource.stars}</span>
                          </span>
                        ) : (
                          <span>源码开放</span>
                        )}
                      </a>
                    ) : item.openSource.isAvailable ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--graphite)] font-mono">
                        <GithubIcon className="h-3 w-3" />
                        <span>源码开放</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-[var(--graphite)] opacity-60">未公开</span>
                    )}
                  </td>

                  <td className="py-3.5 pr-4 pl-2 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      {item.media.liveUrl && (
                        <a
                          href={ensureExternalUrl(item.media.liveUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="访问在线演示"
                          className="flex h-7 w-7 items-center justify-center rounded-[2px] text-[var(--graphite)] hover:text-[var(--ink)] hover:bg-[rgba(23,23,20,0.06)]"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={handleLikeClick}
                        title={isLiked ? '取消赞赏' : '为作者赞赏'}
                        className={`inline-flex h-7 items-center gap-1 rounded-[2px] px-1.5 text-xs transition-colors ${
                          isLiked ? 'text-[var(--vermilion)]' : 'text-[var(--graphite)] hover:text-[var(--ink)]'
                        }`}
                      >
                        <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-[var(--vermilion)]' : ''}`} />
                        <span className="num-tabular text-[11px]">{item.stats.likes}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
