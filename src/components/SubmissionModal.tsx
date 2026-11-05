import React, { useState, useEffect, useRef } from 'react';
import type { Creation, Category } from '../types';
import { CATEGORY_OPTIONS } from '../constants/category';
import { useDialogFocus } from './dialogFocus';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { X, Code2, Upload, Video, Image as ImageIcon, ArrowUpRight } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (creation: Creation) => void;
}

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';

const SUGGESTED_AGENTS = [
  'Claude Code',
  'Cursor',
  'Antigravity',
  'Devin',
  'Windsurf',
  'v0 / Bolt',
  'AutoGen / CrewAI',
  'Browser-Use',
];

const fieldClass =
  'h-11 w-full rounded-[3px] border border-[var(--hairline)] bg-[var(--paper-raised)] px-3 text-sm text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--graphite)] hover:border-[var(--graphite)] focus:border-[var(--ink)]';
const areaClass =
  'w-full rounded-[3px] border border-[var(--hairline)] bg-[var(--paper-raised)] p-3 text-sm leading-6 text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--graphite)] hover:border-[var(--graphite)] focus:border-[var(--ink)]';
const labelClass = 'mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--graphite)]';

const normalizeUrl = (url: string) => {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

const isUsableUrl = (value: string) => {
  if (value.startsWith('data:') || value.startsWith('blob:')) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

export const SubmissionModal: React.FC<SubmissionModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('tools');
  const [agentTool, setAgentTool] = useState('');
  const [liveUrl, setLiveUrl] = useState('');

  const [authorName, setAuthorName] = useState('');
  const [authorHandle, setAuthorHandle] = useState('');
  const [authorAvatar, setAuthorAvatar] = useState(DEFAULT_AVATAR);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const [coverImage, setCoverImage] = useState(
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80'
  );
  const [videoUrl, setVideoUrl] = useState('');
  const [isVideoMedia, setIsVideoMedia] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  const [systemPrompt, setSystemPrompt] = useState('');
  const [keyPrompt, setKeyPrompt] = useState('');
  const [workflow, setWorkflow] = useState('');
  const [toolsInput, setToolsInput] = useState('');

  const [isOpenSource, setIsOpenSource] = useState(true);
  const [githubUrl, setGithubUrl] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [error, setError] = useState('');
  const dialogRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);

  useBodyScrollLock(isOpen);
  useDialogFocus(dialogRef, isOpen);

  const hasUnsavedContent = Boolean(
    title.trim() || tagline.trim() || description.trim() || keyPrompt.trim()
  );

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (hasUnsavedContent) {
        if (!window.confirm('您有已填写但未保存的内容，确认要退出吗？')) {
          return;
        }
      }
      setError('');
      closeRef.current();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasUnsavedContent]);

  if (!isOpen) return null;

  function requestClose() {
    if (hasUnsavedContent) {
      if (!window.confirm('您有已填写但未保存的内容，确认要退出吗？')) {
        return;
      }
    }
    setError('');
    closeRef.current();
  }

  const handleAvatarFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      // Compress avatar to 300x300, avoiding 5MB LocalStorage quota issues
      const compressed = await compressImage(file, { maxDimension: 300, quality: 0.85 });
      setAuthorAvatar(compressed);
    } catch {
      // Fallback to FileReader if compression fails
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') setAuthorAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      // Compress cover image to max 1200px, keeping size around ~80KB
      const compressed = await compressImage(file, { maxDimension: 1200, quality: 0.82 });
      setCoverImage(compressed);
      setIsVideoMedia(false);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCoverImage(reader.result);
          setIsVideoMedia(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const fileUrl = URL.createObjectURL(file);
    setIsVideoMedia(true);
    setVideoUrl(fileUrl);
    setCoverImage(
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80'
    );
  };

  const resetForm = () => {
    setTitle('');
    setTagline('');
    setDescription('');
    setCategory('tools');
    setAgentTool('');
    setLiveUrl('');
    setAuthorName('');
    setAuthorHandle('');
    setAuthorAvatar(DEFAULT_AVATAR);
    setCoverImage(
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80'
    );
    setVideoUrl('');
    setIsVideoMedia(false);
    setSystemPrompt('');
    setKeyPrompt('');
    setWorkflow('');
    setToolsInput('');
    setIsOpenSource(true);
    setGithubUrl('');
    setCodeSnippet('');
    setError('');
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim() || !tagline.trim() || !authorName.trim()) {
      setError('请至少填写作品名称、一句话介绍与作者昵称');
      return;
    }

    if (!agentTool.trim()) {
      setError('请填写核心 Agent 工具');
      return;
    }

    const normalizedLiveUrl = normalizeUrl(liveUrl);
    const normalizedGithubUrl = normalizeUrl(githubUrl);
    const normalizedCoverImage = normalizeUrl(coverImage);

    const urlFields = [
      ['在线体验地址', normalizedLiveUrl],
      ['图片/视频外链地址', normalizedCoverImage],
      ['GitHub 仓库地址', normalizedGithubUrl],
    ] as const;
    const invalidUrlField = urlFields.find(([, value]) => value && !isUsableUrl(value));
    if (invalidUrlField) {
      setError(`${invalidUrlField[0]}格式不正确，请输入有效网址`);
      return;
    }

    const finalAgentTool = agentTool.trim() || 'Custom Agent';

    const newCreation: Creation = {
      id: `creation-${Date.now()}`,
      title: title.trim(),
      tagline: tagline.trim(),
      description: description.trim() || tagline.trim(),
      category,
      agentTool: finalAgentTool as Creation['agentTool'],
      author: {
        name: authorName.trim(),
        handle: authorHandle.startsWith('@') ? authorHandle : `@${authorHandle || 'creator'}`,
        avatar: authorAvatar,
        xUrl: authorHandle ? `https://x.com/${authorHandle.replace('@', '')}` : 'https://x.com',
      },
      media: {
        coverImage: normalizedCoverImage,
        gallery: [normalizedCoverImage],
        videoUrl: videoUrl.trim() || undefined,
        liveUrl: normalizedLiveUrl || undefined,
      },
      recipe: {
        systemPrompt: systemPrompt.trim() || undefined,
        keyPrompts: keyPrompt.trim()
          ? [{ title: '核心生成提示词', prompt: keyPrompt.trim() }]
          : [],
        workflowSteps: workflow.trim()
          ? workflow.split('\n').filter((line) => line.trim().length > 0)
          : ['定义架构规约与数据流', '由 Agent 结对生成交互层', '进行响应式适配与性能打磨'],
        lessonsLearned: ['清晰的规范输入是 Agent 稳定输出的前提'],
        toolsUsed: toolsInput.trim()
          ? toolsInput
              .split(/[,，、\s]+/)
              .map((tool) => tool.trim())
              .filter(Boolean)
          : [finalAgentTool, 'TypeScript'],
      },
      openSource: {
        isAvailable: isOpenSource,
        githubUrl: normalizedGithubUrl || undefined,
        stars: 1,
        license: 'MIT',
        codeSnippet: codeSnippet.trim()
          ? {
              filename: 'src/main.ts',
              language: 'typescript',
              code: codeSnippet.trim(),
            }
          : undefined,
      },
      stats: {
        likes: 1,
        views: 12,
        createdAt: new Date().toISOString().split('T')[0],
      },
    };

    setError('');
    resetForm();
    onSubmit(newCreation);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-6">
      <div
        role="presentation"
        onClick={requestClose}
        className="fixed inset-0 bg-[rgba(23,23,20,0.6)] backdrop-blur-[10px]"
      />

      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="submission-title"
        className="relative z-10 mx-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[760px] flex-col overflow-hidden rounded-[4px] border border-[var(--hairline)] bg-[var(--paper-raised)] shadow-[0_28px_80px_-32px_rgba(23,23,20,0.32)] sm:max-h-[calc(100dvh-3rem)]"
      >
        <div className="flex items-center justify-between gap-4 border-b border-[var(--hairline)] px-5 py-4 sm:px-7">
          <div>
            <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--graphite)]">
              Community Submission
            </p>
            <h2 id="submission-title" className="mt-2 text-lg font-semibold text-[var(--ink)]">
              提交 Agent 造物作品
            </h2>
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label="关闭"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[3px] text-[var(--graphite)] transition-colors hover:bg-[rgba(23,23,20,0.06)] hover:text-[var(--ink)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form noValidate onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          {error && (
            <p
              id="submission-error"
              role="alert"
              className="mb-7 border-l-2 border-[var(--vermilion)] bg-[rgba(200,71,50,0.07)] px-4 py-3 text-sm text-[var(--ink)]"
            >
              {error}
            </p>
          )}

          <FormSection number="01" title="作品基础信息">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="creation-title">作品名称 *</label>
                <input id="creation-title" data-autofocus required className={fieldClass} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例如：PulseQuery 内存分析器" />
              </div>
              <div>
                <label className={labelClass} htmlFor="creation-category">作品分类</label>
                <select id="creation-category" className={fieldClass} value={category} onChange={(event) => setCategory(event.target.value as Category)}>
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="creation-tagline">一句话亮点 *</label>
              <input id="creation-tagline" required className={fieldClass} value={tagline} onChange={(event) => setTagline(event.target.value)} placeholder="例如：基于 Claude Code 构建的本地分析面板，支持 Wasm" />
            </div>

            <div>
              <label className={labelClass} htmlFor="creation-description">作品详细介绍（选填）</label>
              <textarea id="creation-description" rows={3} className={areaClass} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="描述这个作品解决的痛点或更多细节..." />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--graphite)]" htmlFor="creation-agent">
                  核心 Agent 工具（自主填写）*
                </label>
                <span className="text-[10px] text-[var(--graphite)]">支持自由填写任何工具</span>
              </div>
              <input id="creation-agent" required className={fieldClass} value={agentTool} onChange={(event) => setAgentTool(event.target.value)} placeholder="例如：Claude Code、Cursor、Windsurf、Devin、Qwen-Agent 等" />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[10px] text-[var(--graphite)]">快捷填入：</span>
                {SUGGESTED_AGENTS.map((tool) => (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => setAgentTool(tool)}
                    className="cursor-pointer border-b border-[var(--hairline)] pb-0.5 text-xs text-[var(--graphite)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)]"
                  >
                    {tool}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="creation-live-url">在线体验地址（选填）</label>
              <input id="creation-live-url" type="url" className={fieldClass} value={liveUrl} onChange={(event) => setLiveUrl(event.target.value)} placeholder="https://..." />
            </div>
          </FormSection>

          <FormSection number="02" title="作者信息与头像">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="author-name">作者昵称 *</label>
                <input id="author-name" required className={fieldClass} value={authorName} onChange={(event) => setAuthorName(event.target.value)} placeholder="例如：Alex" />
              </div>
              <div>
                <label className={labelClass} htmlFor="author-handle">X Handle</label>
                <input id="author-handle" className={fieldClass} value={authorHandle} onChange={(event) => setAuthorHandle(event.target.value)} placeholder="@your_handle" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5 border-t border-[var(--hairline)] pt-5">
              <img src={authorAvatar} alt="作者头像预览" className="h-14 w-14 rounded-full border border-[var(--hairline)] object-cover" />
              <div>
                <input ref={avatarFileInputRef} type="file" accept="image/*" onChange={handleAvatarFileChange} className="hidden" />
                <button type="button" onClick={() => avatarFileInputRef.current?.click()} className="btn-secondary inline-flex">
                  <Upload className="h-3.5 w-3.5" />
                  <span>选择本地头像文件...</span>
                </button>
                <p className="mt-2 text-xs text-[var(--graphite)]">支持 PNG、JPG、WebP。</p>
              </div>
            </div>
          </FormSection>

          <FormSection number="03" title="视觉展示材料">
            <input
              ref={imageFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              className="hidden"
            />
            <input
              ref={videoFileInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoFileChange}
              className="hidden"
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => imageFileInputRef.current?.click()}
                className="btn-primary inline-flex"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span>上传本地图片</span>
              </button>
              <button
                type="button"
                onClick={() => videoFileInputRef.current?.click()}
                className="btn-secondary inline-flex"
              >
                <Video className="h-3.5 w-3.5" />
                <span>上传演示视频</span>
              </button>
            </div>

            <div className="overflow-hidden rounded-[3px] border border-[var(--hairline)] bg-[rgba(23,23,20,0.04)]">
              {isVideoMedia && videoUrl ? (
                <video src={videoUrl} controls className="aspect-video w-full object-cover" />
              ) : (
                <img src={coverImage} alt="作品封面预览" className="aspect-video w-full object-cover" />
              )}
            </div>

            <div>
              <label className={labelClass} htmlFor="creation-cover-url">或使用图片/视频外链 URL</label>
              <input
                id="creation-cover-url"
                type="url"
                className={fieldClass}
                value={coverImage}
                onChange={(event) => {
                  setCoverImage(event.target.value);
                  setIsVideoMedia(false);
                }}
                placeholder="https://..."
              />
            </div>
          </FormSection>

          <FormSection number="04" title="制作配方与关键提示词">
            <div>
              <label className={labelClass} htmlFor="system-prompt">System Prompt（选填）</label>
              <textarea id="system-prompt" rows={3} className={`${areaClass} font-mono text-xs`} value={systemPrompt} onChange={(event) => setSystemPrompt(event.target.value)} placeholder="给智能体的系统人设或原则指令..." />
            </div>
            <div>
              <label className={labelClass} htmlFor="key-prompt">关键 Prompt</label>
              <textarea id="key-prompt" rows={3} className={`${areaClass} font-mono text-xs`} value={keyPrompt} onChange={(event) => setKeyPrompt(event.target.value)} placeholder="开发过程中最有效的一句关键提示词..." />
            </div>
            <div>
              <label className={labelClass} htmlFor="workflow-steps">推演步骤（每行一步）</label>
              <textarea id="workflow-steps" rows={3} className={`${areaClass} font-mono text-xs`} value={workflow} onChange={(event) => setWorkflow(event.target.value)} placeholder={'步骤 1: 确定数据架构\n步骤 2: 结对生成交互层'} />
            </div>
            <div>
              <label className={labelClass} htmlFor="tools-input">技术栈标签（逗号分隔）</label>
              <input id="tools-input" className={fieldClass} value={toolsInput} onChange={(event) => setToolsInput(event.target.value)} placeholder="例如：Next.js, TypeScript, Tailwind" />
            </div>
          </FormSection>

          <FormSection number="05" title="开源仓库与代码">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--hairline)] pb-4">
              <div className="flex items-center gap-3 text-sm text-[var(--ink)]">
                <Code2 className="h-4 w-4" />
                <label htmlFor="open-source-toggle" className="cursor-pointer font-medium">开源此项目</label>
              </div>
              <input
                id="open-source-toggle"
                type="checkbox"
                checked={isOpenSource}
                onChange={(event) => setIsOpenSource(event.target.checked)}
                className="h-4 w-4 cursor-pointer accent-[var(--vermilion)]"
              />
            </div>

            {isOpenSource && (
              <div className="space-y-5">
                <div>
                  <label className={labelClass} htmlFor="github-url">GitHub 仓库地址</label>
                  <input id="github-url" type="url" className={fieldClass} value={githubUrl} onChange={(event) => setGithubUrl(event.target.value)} placeholder="GitHub 仓库地址 (https://github.com/...)" />
                </div>
                <div>
                  <label className={labelClass} htmlFor="code-snippet">核心代码片段（选填）</label>
                  <textarea id="code-snippet" rows={5} className={`${areaClass} font-mono text-xs`} value={codeSnippet} onChange={(event) => setCodeSnippet(event.target.value)} placeholder="粘贴核心代码片段或配置 (可选)..." />
                </div>
              </div>
            )}
          </FormSection>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--hairline)] pt-6">
            <button
              type="button"
              onClick={requestClose}
              className="btn-secondary min-h-[44px] px-5 text-xs font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              aria-describedby={error ? 'submission-error' : undefined}
              className="btn-primary min-h-[44px] px-6 text-xs font-medium inline-flex items-center gap-2"
            >
              <span>提交造物作品</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

const FormSection: React.FC<{ number: string; title: string; children: React.ReactNode }> = ({
  number,
  title,
  children,
}) => (
  <section className="border-t border-[var(--hairline)] py-7 first:border-t-0 first:pt-0">
    <div className="mb-6 flex items-baseline gap-4">
      <span className="num-tabular font-mono text-xs text-[var(--vermilion)]">{number}</span>
      <h3 className="m-0 text-base font-semibold text-[var(--ink)]">{title}</h3>
    </div>
    <div className="space-y-5">{children}</div>
  </section>
);
