import React from 'react';
import { ArrowRight, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { SITE_CONFIG } from '../constants/siteConfig';
import { XIcon } from './Icons';

interface HeroProps {
  stats: {
    totalCreations: number;
    totalAgents: number;
    openSourceCount: number;
    totalLikes: number;
  };
  onExploreClick: () => void;
  onOpenSubmit: () => void;
}

export const Hero: React.FC<HeroProps> = ({ stats, onExploreClick, onOpenSubmit }) => {
  const { host } = SITE_CONFIG;

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-main">
        <div className="hero-copy">
          <p className="eyebrow">真实作品 · 制作配方 · 开源源码</p>

          <h1 id="hero-title" className="hero-title">
            <span>智能体时代的</span>
            <span>真实造物展馆</span>
          </h1>

          <p className="hero-english" lang="en">
            Made with agents. Finished by people.
          </p>

          <p className="hero-description">
            展示人与智能体共同完成的真实作品，记录制作过程、关键提示词与开源源码。
            从一件成品出发，读懂它如何被做出来，也继续做出自己的版本。
          </p>

          <div className="hero-actions">
            <button type="button" onClick={onOpenSubmit} className="btn-primary">
              <span>提交作品</span>
              <ArrowRight className="button-arrow w-4 h-4 stroke-[1.5]" aria-hidden="true" />
            </button>
            <button type="button" onClick={onExploreClick} className="btn-secondary">
              <span>浏览展厅作品</span>
              <ArrowRight className="button-arrow w-4 h-4 stroke-[1.5]" aria-hidden="true" />
            </button>
          </div>

          {/* Seamless Host Curator Signature Lockup (Zero-Card, 100% Integrated with Particle Canvas) */}
          <div className="mt-12 pt-7 border-t border-[var(--hairline)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3.5">
                <div className="relative shrink-0">
                  <img
                    src={host.avatar}
                    alt={host.name}
                    className="h-12 w-12 rounded-full border border-[var(--hairline)] object-cover shadow-sm ring-2 ring-[var(--paper)]"
                  />
                  <CheckCircle2
                    className="absolute -bottom-0.5 -right-0.5 h-4 w-4 fill-[var(--ink)] text-[var(--paper)]"
                    aria-label="Verified Host"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold tracking-wide text-[var(--ink)]">
                      {host.name}
                    </span>
                    <span className="rounded-[2px] bg-[rgba(23,23,20,0.06)] px-1.5 py-0.5 font-mono text-[10px] font-medium text-[var(--graphite)]">
                      {host.badge}
                    </span>
                  </div>
                  <p className="m-0 mt-0.5 font-mono text-xs text-[var(--graphite)]">
                    {host.handle} · 写给一路陪伴与交流的朋友们
                  </p>
                </div>
              </div>

              <a
                href={host.xUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 self-start rounded-[3px] border border-[var(--hairline)] bg-transparent px-3 py-1.5 text-xs font-medium text-[var(--ink)] transition-colors hover:border-[var(--ink)] hover:bg-[rgba(23,23,20,0.04)] sm:self-auto"
              >
                <XIcon className="h-3 w-3" />
                <span>关注 X {host.handle}</span>
                <ArrowUpRight className="h-3 w-3 text-[var(--graphite)]" />
              </a>
            </div>

            <p className="m-0 mt-3.5 text-xs leading-relaxed text-[var(--graphite)] max-w-2xl">
              “{host.message}”
            </p>
          </div>
        </div>
      </div>

      <dl className="hero-stats" aria-label="展馆数据">
        <div className="hero-stat">
          <dt className="hero-stat-label">真实精选作品</dt>
          <dd className="hero-stat-value num-tabular">{stats.totalCreations}</dd>
        </div>
        <div className="hero-stat">
          <dt className="hero-stat-label">覆盖智能体</dt>
          <dd className="hero-stat-value num-tabular">{stats.totalAgents}</dd>
        </div>
        <div className="hero-stat">
          <dt className="hero-stat-label">开源代码库</dt>
          <dd className="hero-stat-value num-tabular">{stats.openSourceCount}</dd>
        </div>
        <div className="hero-stat">
          <dt className="hero-stat-label">社区致敬赞赏</dt>
          <dd className="hero-stat-value num-tabular">{stats.totalLikes}</dd>
        </div>
      </dl>
    </section>
  );
};
