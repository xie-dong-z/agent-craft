export type AgentTool =
  | 'Claude Code'
  | 'Cursor'
  | 'Antigravity'
  | 'Devin'
  | 'v0 / Bolt'
  | 'AutoGen / CrewAI'
  | 'Custom Agent';

export type Category = 'tools' | 'saas' | 'games' | 'automation' | 'creative';

export interface Author {
  name: string;
  handle: string; // e.g. "@alex_craft"
  avatar: string;
  xUrl: string;
  bio?: string;
  isHost?: boolean;
}

export interface Media {
  coverImage: string;
  gallery: string[];
  videoUrl?: string;
  liveUrl?: string;
}

export interface KeyPrompt {
  title: string;
  prompt: string;
}

export interface Recipe {
  systemPrompt?: string;
  keyPrompts: KeyPrompt[];
  workflowSteps: string[];
  lessonsLearned: string[];
  toolsUsed: string[];
}

export interface CodeSnippet {
  filename: string;
  language: string;
  code: string;
}

export interface OpenSource {
  isAvailable: boolean;
  githubUrl?: string;
  stars?: number;
  license?: string;
  codeSnippet?: CodeSnippet;
}

export interface Creation {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: Category;
  agentTool: AgentTool;
  author: Author;
  media: Media;
  recipe: Recipe;
  openSource: OpenSource;
  stats: {
    likes: number;
    views: number;
    createdAt: string;
  };
  featured?: boolean;
}
