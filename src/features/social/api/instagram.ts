import { API_BASE } from '../../../lib/apiBase';

export type InstagramMediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
export type InstagramMediaProductType = 'FEED' | 'REELS' | 'STORY' | 'AD' | null;

export interface InstagramMediaChild {
  id: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
}

export interface InstagramPost {
  id: string;
  igMediaId: string;
  caption: string | null;
  mediaType: InstagramMediaType;
  mediaProductType: InstagramMediaProductType;
  mediaUrl: string;
  thumbnailUrl: string | null;
  permalink: string;
  igTimestamp: string;
  children: InstagramMediaChild[] | null;
}

export interface InstagramPostsPage {
  data: InstagramPost[];
  totalItems: number;
  hasMore: boolean;
}

export async function fetchInstagramPosts(limit: number, offset: number): Promise<InstagramPostsPage> {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  params.set('offset', String(offset));
  const res = await fetch(`${API_BASE}/instagram/posts?${params.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
