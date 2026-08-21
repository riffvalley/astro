import { API_BASE } from '../../../lib/apiBase';

export interface TelegramPost {
  id: string;
  text: string;
  image: string | null;
  images: string[];
  date: string | null;
  link: string;
}

export interface TelegramPostsPage {
  data: TelegramPost[];
  nextBefore: string | null;
  hasMore: boolean;
}

export async function fetchTelegramPosts(channel: string, limit: number, before?: string): Promise<TelegramPostsPage> {
  const params = new URLSearchParams();
  params.set('channel', channel);
  params.set('limit', String(limit));
  if (before) params.set('before', before);
  const res = await fetch(`${API_BASE}/telegram/posts?${params.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
