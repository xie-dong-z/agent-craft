import React from 'react';
import { SITE_CONFIG } from '../constants/siteConfig';
import { Sparkles, Feather, Search } from 'lucide-react';
import type { AestheticMode } from './ParticleBackground';

interface HeaderProps {
  aestheticMode: AestheticMode;
  onToggleAesthetic: () => void;
  onOpenSubmit: () => void;
  onExploreClick: () => void;
  onOpenCommandPalette?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  aestheticMode,
  onToggleAesthetic,
  onOpenSubmit,
  onExploreClick,
  onOpenCommandPalette,
}) => {
  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="brand-lockup">
          <span className="brand-name">{SITE_CONFIG.brandName}</span>
          <span className="brand-issue">{SITE_CONFIG.issueTag}</span>
        </div>

        <nav className="header-nav" aria-label="主导航">
          <button type="button" onClick={onExploreClick} className="header-nav-link">
            展厅作品
          </button>
          <a
            href={SITE_CONFIG.host.xUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="header-nav-link flex items-center gap-1.5"
            title={`访问 ${SITE_CONFIG.host.name} (${SITE_CONFIG.host.handle}) 的 X 官方主页`}
          >
            <img
              src={SITE_CONFIG.host.avatar}
              alt={SITE_CONFIG.host.name}
              className="h-4 w-4 rounded-full border border-[var(--hairline)] object-cover"
            />
            <span className="hidden min-[420px]:inline">{SITE_CONFIG.host.handle}</span>
          </a>
        </nav>

        <div className="header-action flex items-center gap-2.5">
          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              title="快捷指令与全域检索 (⌘K / Ctrl+K)"
              aria-label="快捷指令与全域检索"
              className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-[4px] border border-[var(--hairline)] bg-[var(--paper-raised)] px-2.5 text-xs text-[var(--graphite)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)] active:scale-[0.98]"
            >
              <Search className="h-3.5 w-3.5" />
              <kbd className="font-mono text-[10px] text-[var(--graphite)]">⌘K</kbd>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleAesthetic}
            title={aestheticMode === 'chromatic' ? '切换为墨韵雅致风' : '切换为炫彩极光粒子'}
            className="inline-flex h-9 items-center gap-1.5 rounded-[4px] border border-[var(--hairline)] bg-[var(--paper-raised)] px-3 text-xs font-medium text-[var(--ink)] transition-colors hover:border-[var(--graphite)] active:scale-[0.98]"
          >
            {aestheticMode === 'chromatic' ? (
              <>
                <Sparkles className="h-3.5 w-3.5 text-pink-600" />
                <span className="hidden sm:inline">炫彩极光</span>
              </>
            ) : (
              <>
                <Feather className="h-3.5 w-3.5 text-[var(--graphite)]" />
                <span className="hidden sm:inline">墨韵金石</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenSubmit}
            className="header-submit h-9 px-3.5 rounded-[4px] active:scale-[0.98]"
          >
            <span>提交作品</span>
            <span className="button-arrow" aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
    </header>
  );
};
