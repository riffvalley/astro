import { describe, expect, it } from 'vitest';
import type { PostDetail } from '../../../lib/wordpress';
import { buildHeaderNavigation } from '../headerNavigation';
import { formatScore, scoreColor } from '../reviewScore';

function post(overrides: Partial<PostDetail>): PostDetail {
  return {
    id: 'post-id',
    title: 'Post title',
    slug: 'post-title',
    uri: '/post-title',
    date: '2026-01-01T00:00:00',
    excerpt: '',
    content: '',
    featuredImage: null,
    author: null,
    seo: null,
    categories: [],
    ...overrides,
  };
}

describe('buildHeaderNavigation', () => {
  it('selects the exact category, preserves input order and limits previews to three', () => {
    const posts = [
      post({ title: 'First', uri: '/first', categories: [{ uri: '/novedades/noticias', name: 'Noticias' }] }),
      post({ title: 'Second', uri: '/second', categories: [{ uri: '/novedades/noticias', name: 'Noticias' }] }),
      post({ title: 'Third', uri: '/third', categories: [{ uri: '/novedades/noticias', name: 'Noticias' }] }),
      post({ title: 'Fourth', uri: '/fourth', categories: [{ uri: '/novedades/noticias', name: 'Noticias' }] }),
      post({ title: 'Different category', uri: '/different', categories: [{ uri: '/novedades/noticias-extra', name: 'Other' }] }),
    ];

    const novedades = buildHeaderNavigation(posts)[1];
    const noticias = novedades.children?.[0];

    expect(noticias?.previewPosts?.map(preview => preview.title)).toEqual(['First', 'Second', 'Third']);
  });

  it('returns the minimal preview view model with optional image and score', () => {
    const [review] = buildHeaderNavigation([
      post({
        title: 'Scored review',
        uri: '/review/scored',
        content: '<div class="score__wrap"><div class="score">8.8</div></div>',
        featuredImage: { node: { sourceUrl: 'https://example.com/review.jpg', fullUrl: 'https://example.com/review-full.jpg', altText: 'Review cover' } },
        categories: [{ uri: '/review-de-discos', name: 'Reviews' }],
      }),
      post({
        title: 'Unscored review',
        uri: '/review/unscored',
        categories: [{ uri: '/review-de-discos', name: 'Reviews' }],
      }),
    ]).filter(item => item.href === '/review-de-discos');

    expect(review.previewPosts).toEqual([
      { href: '/review/scored', title: 'Scored review', imageUrl: 'https://example.com/review.jpg', score: 8.8 },
      { href: '/review/unscored', title: 'Unscored review', imageUrl: null, score: null },
    ]);
  });
});

describe('review score presentation', () => {
  it('uses the existing score thresholds', () => {
    expect(scoreColor(8)).toBe('#3fae6a');
    expect(scoreColor(6)).toBe('#d9a233');
    expect(scoreColor(5.9)).toBe('#d93259');
  });

  it('keeps integer and decimal score formatting', () => {
    expect(formatScore(9)).toBe('9');
    expect(formatScore(8.8)).toBe('8.8');
    expect(formatScore(6.25)).toBe('6.3');
  });
});
