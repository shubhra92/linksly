export interface Link {
  id: string;
  originalUrl: string;
  shortCode: string;
  customAlias?: string;
  title?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  isActive: boolean;
  totalClicks: number;
  clicks?: Click[];
}

export interface Click {
  id: string;
  linkId: string;
  ip?: string;
  userAgent?: string;
  referer?: string;
  country?: string;
  city?: string;
  device?: string;
  browser?: string;
  os?: string;
  createdAt: string;
}

export interface Analytics {
  totalLinks: number;
  totalClicks: number;
  recentClicks: number;
  topLinks: TopLink[];
  clicksOverTime: ClicksOverTime[];
}

export interface TopLink {
  id: string;
  originalUrl: string;
  shortCode: string;
  totalClicks: number;
  title?: string;
}

export interface ClicksOverTime {
  date: string;
  clicks: number;
}

export interface CreateLinkRequest {
  originalUrl: string;
  customAlias?: string;
  title?: string;
  description?: string;
  expiresAt?: string;
}