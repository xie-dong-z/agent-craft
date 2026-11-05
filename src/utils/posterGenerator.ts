import type { Creation } from '../types';
import { SITE_CONFIG } from '../constants/siteConfig';

/**
 * Generates an Apple / Bauhaus editorial share poster for Twitter/X
 * Outputs a Blob / DataURL of a high-resolution 2x retina image
 */
export async function generateCreationPoster(creation: Creation): Promise<string> {
  const canvas = document.createElement('canvas');
  const width = 1000;
  const height = 1300;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  // Background - Editorial warm cream paper
  ctx.fillStyle = '#f4f1ea';
  ctx.fillRect(0, 0, width, height);

  // Outer delicate framing border
  ctx.strokeStyle = 'rgba(23, 23, 20, 0.12)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(32, 32, width - 64, height - 64);

  // Inner card background
  ctx.fillStyle = '#faf8f3';
  ctx.fillRect(48, 48, width - 96, height - 96);
  ctx.strokeStyle = 'rgba(23, 23, 20, 0.08)';
  ctx.strokeRect(48, 48, width - 96, height - 96);

  // Top Accent Bar (Vermilion)
  ctx.fillStyle = '#c84732';
  ctx.fillRect(72, 72, 48, 3);

  // Header Brand Lockup
  ctx.fillStyle = '#6e6e66';
  ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('AGENTCRAFT · 造物索引 / ISSUE 001', 132, 78);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#8f8f85';
  ctx.font = '500 12px "SF Mono", Monaco, Consolas, monospace';
  ctx.fillText(creation.category.toUpperCase(), width - 72, 78);
  ctx.textAlign = 'left';

  // Divider line
  ctx.strokeStyle = 'rgba(23, 23, 20, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(72, 102);
  ctx.lineTo(width - 72, 102);
  ctx.stroke();

  // Agent Tool Pill
  ctx.fillStyle = 'rgba(23, 23, 20, 0.05)';
  ctx.fillRect(72, 130, 160, 28);
  ctx.strokeStyle = 'rgba(23, 23, 20, 0.12)';
  ctx.strokeRect(72, 130, 160, 28);

  ctx.fillStyle = '#171714';
  ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`MADE WITH ${creation.agentTool.toUpperCase()}`, 86, 149);

  // Creation Title (Large Editorial Typography)
  ctx.fillStyle = '#171714';
  ctx.font = '700 42px -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", sans-serif';
  
  // Wrap title
  const words = creation.title;
  let titleY = 210;
  ctx.fillText(words, 72, titleY);

  // Tagline / Description
  ctx.fillStyle = '#5c5c54';
  ctx.font = '400 19px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  const tagline = creation.tagline || creation.description;
  const maxWidth = width - 144;
  
  function wrapText(text: string, x: number, y: number, lineH: number, maxLines = 3) {
    let line = '';
    let curY = y;
    let linesDrawn = 0;
    for (let n = 0; n < text.length; n += 1) {
      const testLine = line + text[n];
      const metrics = ctx!.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        if (linesDrawn >= maxLines - 1) {
          ctx!.fillText(line + '...', x, curY);
          return curY + lineH;
        }
        ctx!.fillText(line, x, curY);
        line = text[n];
        curY += lineH;
        linesDrawn += 1;
      } else {
        line = testLine;
      }
    }
    ctx!.fillText(line, x, curY);
    return curY + lineH;
  }

  const afterTaglineY = wrapText(tagline, 72, titleY + 50, 32, 2);

  // Technical Stack Badges
  const techY = afterTaglineY + 12;
  const toolsText = creation.recipe.toolsUsed.slice(0, 5).join(' · ');
  ctx.fillStyle = '#8f8f85';
  ctx.font = '500 13px "SF Mono", Monaco, Consolas, monospace';
  ctx.fillText(`技术底座: ${toolsText}`, 72, techY);

  // Recipe / Prompt Box
  const quoteBoxY = techY + 36;
  const quoteBoxHeight = 360;
  ctx.fillStyle = '#f3f0e8';
  ctx.fillRect(72, quoteBoxY, width - 144, quoteBoxHeight);
  ctx.strokeStyle = 'rgba(23, 23, 20, 0.1)';
  ctx.strokeRect(72, quoteBoxY, width - 144, quoteBoxHeight);

  // Red accent on left edge of prompt box
  ctx.fillStyle = '#c84732';
  ctx.fillRect(72, quoteBoxY, 4, quoteBoxHeight);

  // Prompt header
  ctx.fillStyle = '#6e6e66';
  ctx.font = '600 12px "SF Mono", Monaco, Consolas, monospace';
  const promptLabel = creation.recipe.systemPrompt ? 'KEY SYSTEM PROMPT / 核心提示词设定' : 'RECIPE HIGHLIGHT / 制作配方精选';
  ctx.fillText(promptLabel, 96, quoteBoxY + 34);

  // Prompt content
  const quoteText = creation.recipe.systemPrompt || (creation.recipe.keyPrompts[0]?.prompt ?? creation.description);
  ctx.fillStyle = '#262622';
  ctx.font = '400 15px "SF Mono", Monaco, Consolas, monospace';
  wrapText(quoteText.trim(), 96, quoteBoxY + 70, 26, 9);

  // Creator profile block
  const authorY = quoteBoxY + quoteBoxHeight + 52;
  ctx.strokeStyle = 'rgba(23, 23, 20, 0.1)';
  ctx.beginPath();
  ctx.moveTo(72, authorY - 24);
  ctx.lineTo(width - 72, authorY - 24);
  ctx.stroke();

  // Author details
  ctx.fillStyle = '#171714';
  ctx.font = '600 17px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  ctx.fillText(`创作者：${creation.author.name}`, 72, authorY + 6);

  ctx.fillStyle = '#7a7a70';
  ctx.font = '500 13px "SF Mono", Monaco, Consolas, monospace';
  ctx.fillText(creation.author.handle, 72, authorY + 30);

  // Open source repository status
  if (creation.openSource.isAvailable) {
    ctx.textAlign = 'right';
    ctx.fillStyle = '#171714';
    ctx.font = '600 14px "SF Mono", Monaco, Consolas, monospace';
    const stars = creation.openSource.stars ? ` · ★ ${creation.openSource.stars}` : '';
    ctx.fillText(`GitHub: ${creation.openSource.license ?? 'MIT'}${stars}`, width - 72, authorY + 8);
    ctx.fillStyle = '#7a7a70';
    ctx.font = '400 12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('开放完整源码与制作步骤', width - 72, authorY + 28);
    ctx.textAlign = 'left';
  }

  // Footer Curator Stamp
  const footerY = height - 90;
  ctx.fillStyle = 'rgba(23, 23, 20, 0.04)';
  ctx.fillRect(72, footerY - 24, width - 144, 52);
  ctx.strokeStyle = 'rgba(23, 23, 20, 0.08)';
  ctx.strokeRect(72, footerY - 24, width - 144, 52);

  ctx.fillStyle = '#171714';
  ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  ctx.fillText(`策展人：${SITE_CONFIG.host.name} (${SITE_CONFIG.host.handle}) · 智能体时代的真实造物展馆`, 92, footerY + 8);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#8f8f85';
  ctx.font = '500 12px "SF Mono", Monaco, Consolas, monospace';
  ctx.fillText('x.com/xiedongznq', width - 92, footerY + 8);
  ctx.textAlign = 'left';

  return canvas.toDataURL('image/png');
}
