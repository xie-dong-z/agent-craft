export interface HostConfig {
  name: string;
  handle: string; // e.g. "@creator_x"
  avatar: string;
  xUrl: string;
  badge: string;
  message: string;
}

export interface SiteConfig {
  brandName: string;
  issueTag: string;
  tagline: string;
  description: string;
  host: HostConfig;
}

export const SITE_CONFIG: SiteConfig = {
  brandName: 'AGENTCRAFT',
  issueTag: '造物索引 / ISSUE 001',
  tagline: '智能体时代的真实造物展馆',
  description:
    '收录人与智能体共同完成的真实作品，记录制作过程、关键提示词与开源代码。从一件成品出发，读懂它如何被做出来，也继续做出自己的版本。',
  host: {
    name: '谢东',
    handle: '@xiedongznq',
    avatar: '/host-avatar.jpg',
    xUrl: 'https://x.com/xiedongznq',
    badge: 'X 博主 · 展馆发起人',
    message:
      '感谢大家一路的陪伴与交流！搭建这个展馆就是为了让更多真实的 Agent 成果被看见并得以复刻。无论是一个精巧的脚本还是完整 SaaS，只要你亲手搭建，这里始终为你保留展位。',
  },
};
