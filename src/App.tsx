import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Creation, Category } from './types';
import { CATEGORY_LABELS } from './constants/category';
import {
  getStoredCreations,
  saveCreation,
  getUserLikes,
  toggleLikeCreation,
  computeGlobalStats,
  resetToSeedData,
  exportCreationsJSON,
  syncCreationsFromCloud,
} from './data/storage';
import { ParticleBackground, type AestheticMode } from './components/ParticleBackground';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { FilterSection, type SortOption } from './components/FilterSection';
import { CreationCard } from './components/CreationCard';
import { CreationCompactList } from './components/CreationCompactList';
import { CreationDetailModal } from './components/CreationDetailModal';
import { SubmissionModal } from './components/SubmissionModal';
import { CommandPalette } from './components/CommandPalette';
import { Footer } from './components/Footer';
import { ToastContainer, type ToastMessage } from './components/Toast';
import { triggerSubmitConfetti } from './utils/confetti';

const BASE_AGENTS = [
  'Claude Code',
  'Cursor',
  'Antigravity',
  'Devin',
  'v0 / Bolt',
  'AutoGen / CrewAI',
  'Windsurf',
];

export function App() {
  const [creations, setCreations] = useState<Creation[]>(getStoredCreations);
  const [userLikes, setUserLikes] = useState<string[]>(getUserLikes);

  // Filters & Sorting
  const [selectedAgent, setSelectedAgent] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [openSourceOnly, setOpenSourceOnly] = useState(false);
  const [recipeOnly, setRecipeOnly] = useState(false);
  const [likesOnly, setLikesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('default');

  // Modals & Inspection (Lazy initialized with URL deep link support)
  const [inspectingCreation, setInspectingCreation] = useState<Creation | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const targetId = urlParams.get('id') || window.location.hash.replace('#', '');
      if (targetId) {
        return getStoredCreations().find((c) => c.id === targetId) || null;
      }
    } catch {
      return null;
    }
    return null;
  });
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // View Mode: 'grid' (Gallery Cards) vs 'list' (Compact Table List)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window === 'undefined') return 'grid';
    try {
      const saved = localStorage.getItem('agentcraft_view_mode');
      if (saved === 'grid' || saved === 'list') return saved;
    } catch {
      // fallback
    }
    return 'grid';
  });

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    try {
      localStorage.setItem('agentcraft_view_mode', mode);
    } catch {
      // Ignore
    }
  };

  // Visual Aesthetic Mode ('ink' vs 'chromatic') - Defaults to dazzling chromatic on white canvas
  const [aestheticMode, setAestheticMode] = useState<AestheticMode>(() => {
    if (typeof window === 'undefined') return 'chromatic';
    try {
      const saved = localStorage.getItem('agentcraft_aesthetic_mode');
      if (saved === 'ink' || saved === 'chromatic') return saved;
    } catch {
      // fallback
    }
    return 'chromatic';
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (title: string, description?: string, type: 'success' | 'info' | 'warning' = 'success') => {
      const newToast: ToastMessage = {
        id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title,
        description,
        type,
      };
      setToasts((prev) => [...prev, newToast]);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync latest creations from Cloud on mount (if Supabase is connected)
  useEffect(() => {
    syncCreationsFromCloud().then((synced) => {
      if (synced && synced.length > 0) {
        setCreations(synced);
      }
    });
  }, []);

  // Listen to browser forward/back navigation
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const targetId = urlParams.get('id') || window.location.hash.replace('#', '');
      if (targetId) {
        const found = creations.find((c) => c.id === targetId);
        setInspectingCreation(found || null);
      } else {
        setInspectingCreation(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [creations]);

  // Global shortcut: '⌘K' or 'Ctrl+K' for Spotlight Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

      if (e.key === 'n' || e.key === 'N') {
        if (inspectingCreation || isSubmitModalOpen) return;
        e.preventDefault();
        setIsSubmitModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inspectingCreation, isSubmitModalOpen]);

  const globalStats = useMemo(() => computeGlobalStats(creations), [creations]);

  // Dynamically extract all available Agent tools across all projects
  const availableAgents = useMemo(() => {
    const set = new Set<string>(BASE_AGENTS);
    creations.forEach((item) => {
      if (item.agentTool) set.add(item.agentTool);
    });
    return Array.from(set);
  }, [creations]);

  // Filtered & Sorted Creations
  const filteredCreations = useMemo(() => {
    const filtered = creations.filter((item) => {
      if (selectedAgent !== 'ALL' && item.agentTool !== selectedAgent) {
        return false;
      }
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      if (openSourceOnly && !item.openSource.isAvailable) {
        return false;
      }
      if (likesOnly && !userLikes.includes(item.id)) {
        return false;
      }
      if (
        recipeOnly &&
        !item.recipe.systemPrompt &&
        item.recipe.keyPrompts.length === 0 &&
        item.recipe.workflowSteps.length === 0
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchTagline = item.tagline.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchAgent = item.agentTool.toLowerCase().includes(q);
        const matchCategory =
          item.category.toLowerCase().includes(q) ||
          (CATEGORY_LABELS[item.category] || '').toLowerCase().includes(q);
        const matchAuthor =
          item.author.name.toLowerCase().includes(q) ||
          item.author.handle.toLowerCase().includes(q);
        const matchTools = item.recipe.toolsUsed.some((tool) =>
          tool.toLowerCase().includes(q)
        );
        if (
          !matchTitle &&
          !matchTagline &&
          !matchDesc &&
          !matchAgent &&
          !matchCategory &&
          !matchAuthor &&
          !matchTools
        ) {
          return false;
        }
      }
      return true;
    });

    // Apply Sorting
    return filtered.sort((a, b) => {
      if (sortBy === 'likes') {
        return b.stats.likes - a.stats.likes;
      }
      if (sortBy === 'stars') {
        return (b.openSource.stars || 0) - (a.openSource.stars || 0);
      }
      if (sortBy === 'newest') {
        return b.stats.createdAt.localeCompare(a.stats.createdAt);
      }
      // 'default' keeps original curated rank order
      return 0;
    });
  }, [
    creations,
    selectedAgent,
    selectedCategory,
    openSourceOnly,
    recipeOnly,
    likesOnly,
    userLikes,
    searchQuery,
    sortBy,
  ]);

  const inspectingIndex = useMemo(() => {
    if (!inspectingCreation) return -1;
    return filteredCreations.findIndex((c) => c.id === inspectingCreation.id);
  }, [inspectingCreation, filteredCreations]);

  const handleOpenCreation = (creation: Creation) => {
    setInspectingCreation(creation);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('id', creation.id);
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Ignore if URL modification fails in restricted environments
    }
  };

  const handleNavigateCreation = useCallback(
    (direction: 'prev' | 'next') => {
      if (filteredCreations.length === 0) return;
      const currentIdx = inspectingIndex >= 0 ? inspectingIndex : 0;
      const nextIdx =
        direction === 'prev'
          ? (currentIdx - 1 + filteredCreations.length) % filteredCreations.length
          : (currentIdx + 1) % filteredCreations.length;
      handleOpenCreation(filteredCreations[nextIdx]);
    },
    [filteredCreations, inspectingIndex]
  );

  const handleCloseCreation = () => {
    setInspectingCreation(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('id');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    } catch {
      // Ignore
    }
  };

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { updatedCreations, isLiked } = toggleLikeCreation(id);
    setCreations(updatedCreations);
    setUserLikes(getUserLikes());

    if (isLiked) {
      addToast('已赞赏', '感谢为该创作者助力');
    }

    if (inspectingCreation && inspectingCreation.id === id) {
      const updated = updatedCreations.find((c) => c.id === id);
      if (updated) setInspectingCreation(updated);
    }
  };

  const handleSubmitCreation = (newCreation: Creation) => {
    const { creations: updated, error } = saveCreation(newCreation);
    setCreations(updated);
    setSelectedAgent('ALL');
    setSelectedCategory('ALL');
    setSearchQuery('');
    handleOpenCreation(newCreation);

    // Trigger celebratory confetti burst!
    triggerSubmitConfetti();
    if (error) {
      addToast('已入驻展厅（提示）', error, 'warning');
    } else {
      addToast('已入驻展厅', newCreation.title);
    }
  };

  const handleResetFilters = () => {
    setSelectedAgent('ALL');
    setSelectedCategory('ALL');
    setSearchQuery('');
    setOpenSourceOnly(false);
    setRecipeOnly(false);
    setLikesOnly(false);
    setSortBy('default');
    addToast('筛选已重置', '恢复全部视角', 'info');
  };

  const handleScrollToGallery = () => {
    const el = document.getElementById('gallery-filter');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleExportData = () => {
    exportCreationsJSON(creations);
    addToast('已导出 JSON', `共下载 ${creations.length} 件造物数据`, 'info');
  };

  const handleResetData = () => {
    if (window.confirm('确认重置展馆数据为官方 30 款精选预设吗？')) {
      const reset = resetToSeedData();
      setCreations(reset);
      setUserLikes([]);
      addToast('已重置', '恢复官方 30 款初始种子', 'warning');
    }
  };

  const handleShareToX = () => {
    const text = encodeURIComponent(
      `发现了一个由 @xiedongznq 专为 X 社区打造的极简 AI Agent 真实造物展馆「AgentCraft」，收录大家亲手打造的 30+ 款真实开源项目与提示词配方：`
    );
    const url = encodeURIComponent(window.location.origin + window.location.pathname);
    window.open(`https://x.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    addToast('已唤起 X 分享', '感谢传播与支持', 'info');
  };

  const toggleAesthetic = () => {
    setAestheticMode((prev) => {
      const next = prev === 'ink' ? 'chromatic' : 'ink';
      try {
        localStorage.setItem('agentcraft_aesthetic_mode', next);
      } catch {
        // Ignore
      }
      return next;
    });
  };

  return (
    <div
      className={`editorial-shell transition-colors duration-500 ${
        aestheticMode === 'chromatic' ? 'chromatic-canvas' : ''
      }`}
    >
      <ParticleBackground mode={aestheticMode} />

      <div className="site-content">
        <Header
          aestheticMode={aestheticMode}
          onToggleAesthetic={toggleAesthetic}
          onOpenSubmit={() => setIsSubmitModalOpen(true)}
          onExploreClick={handleScrollToGallery}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        <main className="flex-1">
          <Hero
            stats={globalStats}
            onExploreClick={handleScrollToGallery}
            onOpenSubmit={() => setIsSubmitModalOpen(true)}
          />

          <div className="gallery-surface">
            <FilterSection
              selectedAgent={selectedAgent}
              onSelectAgent={setSelectedAgent}
              availableAgents={availableAgents}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              openSourceOnly={openSourceOnly}
              onToggleOpenSource={() => setOpenSourceOnly((prev) => !prev)}
              recipeOnly={recipeOnly}
              onToggleRecipe={() => setRecipeOnly((prev) => !prev)}
              likesOnly={likesOnly}
              onToggleLikesOnly={() => setLikesOnly((prev) => !prev)}
              userLikesCount={userLikes.length}
              sortBy={sortBy}
              onSortChange={setSortBy}
              resultCount={filteredCreations.length}
              onResetFilters={handleResetFilters}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
            />

            <section className="gallery-grid max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              {filteredCreations.length > 0 ? (
                viewMode === 'list' ? (
                  <CreationCompactList
                    creations={filteredCreations}
                    userLikes={userLikes}
                    onLike={handleLike}
                    onOpenCreation={handleOpenCreation}
                    onFilterAgent={(agent) => {
                      setSelectedAgent(agent);
                      handleScrollToGallery();
                    }}
                    onFilterCategory={(cat) => {
                      setSelectedCategory(cat);
                      handleScrollToGallery();
                    }}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredCreations.map((item, idx) => (
                      <CreationCard
                        key={item.id}
                        index={idx + 1}
                        creation={item}
                        isLiked={userLikes.includes(item.id)}
                        onLike={handleLike}
                        onClick={handleOpenCreation}
                        onFilterAgent={(agent) => {
                          setSelectedAgent(agent);
                          handleScrollToGallery();
                        }}
                        onFilterCategory={(cat) => {
                          setSelectedCategory(cat);
                          handleScrollToGallery();
                        }}
                      />
                    ))}
                  </div>
                )
              ) : (
                <div className="empty-state">
                  <h3>
                    {likesOnly && userLikes.length === 0
                      ? '你还没有赞赏或收藏过任何造物'
                      : searchQuery.trim()
                      ? `未找到与 “${searchQuery.trim()}” 相关的造物`
                      : '未找到匹配作品'}
                  </h3>
                  <p>
                    {likesOnly && userLikes.length === 0
                      ? '浏览展厅时为喜欢的 Agent 作品点击心形按钮即可加入赞赏收藏，并在此快速回看。'
                      : searchQuery.trim()
                      ? '请尝试换用其他关键词、检索其他智能体工具（如 Claude、Cursor、Devin），或重置筛选条件。'
                      : '调整筛选维度或重置条件，继续探索社区真实造物。'}
                  </p>
                  <button
                    type="button"
                    onClick={likesOnly && userLikes.length === 0 ? () => setLikesOnly(false) : handleResetFilters}
                    className="empty-reset"
                  >
                    <span>{likesOnly && userLikes.length === 0 ? '浏览全部精选作品' : '重置全部筛选'}</span>
                    <span className="button-arrow" aria-hidden="true">↗</span>
                  </button>
                </div>
              )}
            </section>
          </div>
        </main>

        <Footer
          onExportData={handleExportData}
          onResetData={handleResetData}
          onShareToX={handleShareToX}
        />
      </div>

      {/* Creation Detail Deep Modal */}
      <CreationDetailModal
        creation={inspectingCreation}
        onClose={handleCloseCreation}
        isLiked={inspectingCreation ? userLikes.includes(inspectingCreation.id) : false}
        onLike={handleLike}
        onNavigate={handleNavigateCreation}
        currentIndex={inspectingIndex}
        totalCount={filteredCreations.length}
      />

      {/* Community Submission Modal */}
      <SubmissionModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmit={handleSubmitCreation}
      />

      {/* Apple Spotlight Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        creations={creations}
        onSelectCreation={handleOpenCreation}
        onOpenSubmit={() => setIsSubmitModalOpen(true)}
        aestheticMode={aestheticMode}
        onToggleAesthetic={toggleAesthetic}
        onToggleLikesOnly={() => setLikesOnly((prev) => !prev)}
        onExportData={handleExportData}
      />

      {/* Toast Alert Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
