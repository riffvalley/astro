import { describe, expect, it } from 'vitest';

import { extractHighlightedBands, extractReviewScore } from './wordpress';

describe('extractReviewScore', () => {
  it('extracts the decimal score from the supported review markup', () => {
    const content = '<div class="score__wrap review-score"><div class="score">8.8</div></div>';

    expect(extractReviewScore(content)).toBe(8.8);
  });

  it('returns null when the review markup has no score', () => {
    expect(extractReviewScore('<p>Reseña sin bloque de puntuación.</p>')).toBeNull();
  });
});

describe('extractHighlightedBands', () => {
  it('normalizes inline markup, entities and the trailing conjunction', () => {
    const content = '<p>Os hablaremos de los nuevos trabajos de <strong>Converge</strong>, Touché Amoré y Art&amp;est.</p>';

    expect(extractHighlightedBands(content)).toEqual(['Converge', 'Touché Amoré', 'Art&est']);
  });
});
