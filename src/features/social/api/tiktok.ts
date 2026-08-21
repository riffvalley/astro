import { API_BASE } from '../../../lib/apiBase';

export interface TikTokVideoSummary {
  id: string;
  title: string;
  coverImageUrl: string;
  permalink: string;
  embedLink: string;
  duration: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createTime: string;
}

export interface TikTokVideoDetail extends TikTokVideoSummary {
  videoDescription: string;
  embedHtml: string;
}

export interface TikTokVideosPage {
  data: TikTokVideoSummary[];
  totalItems: number;
  hasMore: boolean;
}

export async function fetchTikTokVideos(limit: number, offset: number): Promise<TikTokVideosPage> {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  params.set('offset', String(offset));
  const res = await fetch(`${API_BASE}/tiktok/videos?${params.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchTikTokVideo(id: string): Promise<TikTokVideoDetail> {
  const res = await fetch(`${API_BASE}/tiktok/videos/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
