export type LinkPlatform = 'spotify' | 'bandcamp' | 'youtube' | 'link';

export function detectLinkPlatform(url: string): LinkPlatform {
  let hostname = '';
  try {
    hostname = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return 'link';
  }
  if (hostname.includes('spotify.com')) return 'spotify';
  if (hostname.endsWith('bandcamp.com')) return 'bandcamp';
  if (hostname.includes('youtube.com') || hostname === 'youtu.be') return 'youtube';
  return 'link';
}
