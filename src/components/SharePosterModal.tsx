import React, { useState, useEffect } from 'react';
import type { Creation } from '../types';
import { generateCreationPoster } from '../utils/posterGenerator';
import { Download, Copy, Check, X, Sparkles } from 'lucide-react';
import { XIcon } from './Icons';

interface SharePosterModalProps {
  creation: Creation | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SharePosterModal: React.FC<SharePosterModalProps> = ({
  creation,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !creation) return null;

  return <SharePosterDialog key={creation.id} creation={creation} onClose={onClose} />;
};

const SharePosterDialog: React.FC<{ creation: Creation; onClose: () => void }> = ({
  creation,
  onClose,
}) => {
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  useEffect(() => {
    let isCancelled = false;

    generateCreationPoster(creation)
      .then((dataUrl) => {
        if (!isCancelled) {
          setPosterUrl(dataUrl);
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate poster:', err);
        if (!isCancelled) setIsGenerating(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [creation]);

  const handleDownload = () => {
    if (!posterUrl) return;
    const a = document.createElement('a');
    a.href = posterUrl;
    a.download = `AgentCraft-${creation.title.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyToClipboard = async () => {
    if (!posterUrl) return;
    try {
      const res = await fetch(posterUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback: download if copying image blob is unsupported
      handleDownload();
    }
  };

  const handleShareToX = () => {
    const text = encodeURIComponent(
      `在 @xiedongznq 策展的展馆发现了一款惊艳造物「${creation.title}」！核心工具 ${creation.agentTool}，附带配方与开源代码：`
    );
    const url = encodeURIComponent(
      `${window.location.origin}${window.location.pathname}?id=${creation.id}`
    );
    window.open(`https://x.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        role="presentation"
        onClick={onClose}
        className="fixed inset-0 bg-[rgba(23,23,20,0.65)] backdrop-blur-md"
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-[4px] border border-[var(--hairline)] bg-[var(--paper-raised)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--hairline)] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--vermilion)]" />
            <h3 className="m-0 text-sm font-semibold text-[var(--ink)]">
              作品分享海报 · 优雅卡片
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭海报"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[3px] text-[var(--graphite)] hover:bg-[rgba(23,23,20,0.06)] hover:text-[var(--ink)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 text-center">
          {isGenerating || !posterUrl ? (
            <div className="flex aspect-[10/13] w-full max-w-md mx-auto items-center justify-center rounded-[3px] border border-dashed border-[var(--hairline)] bg-[rgba(23,23,20,0.02)]">
              <p className="text-xs font-mono text-[var(--graphite)] animate-pulse">
                正在渲染精美卡片...
              </p>
            </div>
          ) : (
            <div className="relative mx-auto max-w-md overflow-hidden rounded-[3px] border border-[var(--hairline)] shadow-lg">
              <img
                src={posterUrl}
                alt={`${creation.title} 分享海报`}
                className="w-full object-contain"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--hairline)] bg-[var(--paper)] px-5 py-3.5">
          <button
            type="button"
            onClick={handleShareToX}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[3px] border border-[var(--hairline)] px-3 py-1.5 text-xs text-[var(--graphite)] hover:border-[var(--ink)] hover:text-[var(--ink)]"
          >
            <XIcon className="h-3 w-3" />
            <span>分享推文</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!posterUrl}
              onClick={handleCopyToClipboard}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-[3px] border border-[var(--hairline)] bg-[var(--paper-raised)] px-3 py-1.5 text-xs text-[var(--ink)] transition-colors hover:border-[var(--ink)] disabled:opacity-50"
            >
              {isCopied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[var(--vermilion)]" />
                  <span>已复制图片</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>复制图片</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={!posterUrl}
              onClick={handleDownload}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-[3px] border border-[var(--ink)] bg-[var(--ink)] px-3.5 py-1.5 text-xs text-[var(--paper-raised)] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              <span>下载海报 (PNG)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
