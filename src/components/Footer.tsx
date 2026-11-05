import React from 'react';
import { ArrowUp, Download, RotateCcw } from 'lucide-react';
import { XIcon } from './Icons';
import { SITE_CONFIG } from '../constants/siteConfig';

interface FooterProps {
  onExportData: () => void;
  onResetData: () => void;
  onShareToX: () => void;
}

const actionClass =
  'inline-flex cursor-pointer items-center gap-2 border-b border-[var(--hairline)] pb-1 text-xs text-[var(--graphite)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)]';
const eyebrowClass = 'm-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--graphite)]';

export const Footer: React.FC<FooterProps> = ({ onExportData, onResetData, onShareToX }) => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="relative z-10 mt-20 border-t border-[var(--hairline)] bg-[var(--paper-raised)]">
      <div className="mx-auto w-full max-w-[1440px] px-5 py-12 sm:px-8 lg:px-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)] lg:gap-16">
          <section className="max-w-3xl">
            <p className={eyebrowClass}>Curator’s note / 编辑手记</p>
            <p className="mt-5 text-sm leading-8 text-[var(--graphite)]">
              为了感谢大家的陪伴与讨论，我（
              <a
                href={SITE_CONFIG.host.xUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--ink)] underline underline-offset-4 hover:text-[var(--vermilion)]"
              >
                {SITE_CONFIG.host.handle}
              </a>
              ）搭建了这个纯粹的展厅。无论你是用 Cursor 写出的实用 CLI，
              还是用 Claude Code 跑出来的全栈 SaaS，只要你亲手用 Agent 孵化了想法，这里永远有你的专属展位。
            </p>
          </section>

          <section className="border-t border-[var(--hairline)] pt-6 lg:border-t-0 lg:border-l lg:pl-10 lg:pt-0">
            <p className={eyebrowClass}>展馆操作</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
              <button type="button" onClick={onShareToX} className={actionClass}>
                <XIcon className="h-3.5 w-3.5" />
                <span>分享至 X</span>
              </button>
              <button type="button" onClick={onExportData} className={actionClass}>
                <Download className="h-3.5 w-3.5" />
                <span>导出 JSON</span>
              </button>
              <button type="button" onClick={onResetData} className={actionClass}>
                <RotateCcw className="h-3.5 w-3.5" />
                <span>重置预设</span>
              </button>
              <button
                type="button"
                onClick={scrollToTop}
                aria-label="回到顶部"
                title="回到顶部"
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[3px] border border-[var(--hairline)] text-[var(--graphite)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)]"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </section>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[var(--hairline)] pt-5 text-xs text-[var(--graphite)] sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0">{SITE_CONFIG.brandName} · 为 X 社区创作者与关注者而做</p>
          <p className="m-0">真实作品 · 制作过程 · 开源代码</p>
        </div>
      </div>
    </footer>
  );
};
