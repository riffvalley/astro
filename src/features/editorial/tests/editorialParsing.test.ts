import { describe, expect, it } from 'vitest';

import { extractHighlightedBands, extractReviewScore } from '../utils/editorialParsing';

describe('extractReviewScore', () => {
  it('extracts the decimal score from the supported review markup', () => {
    const content = '<div class="score__wrap review-score"><div class="score">8.8</div></div>';

    expect(extractReviewScore(content)).toBe(8.8);
  });

  it('returns null when the review markup has no score', () => {
    expect(extractReviewScore('<p>Reseña sin bloque de puntuación.</p>')).toBeNull();
  });

  it('extracts an integer score written without decimals', () => {
    expect(extractReviewScore('<div class="score__wrap"><div class="score">9</div></div>')).toBe(9);
  });

  it('matches the first score block when several class name variants are combined', () => {
    const content = '<div class="score__wrap alt extra" style="color:red"><div class="score">6.5</div></div>';
    expect(extractReviewScore(content)).toBe(6.5);
  });
});

describe('extractHighlightedBands', () => {
  it('normalizes inline markup, entities and the trailing conjunction', () => {
    const content = '<p>Os hablaremos de los nuevos trabajos de <strong>Converge</strong>, Touché Amoré y Art&amp;est.</p>';

    expect(extractHighlightedBands(content)).toEqual(['Converge', 'Touché Amoré', 'Art&est']);
  });

  it('returns a single band when there is no trailing conjunction to split', () => {
    const content = '<p>Os hablaremos de los nuevos trabajos de Gojira.</p>';

    expect(extractHighlightedBands(content)).toEqual(['Gojira']);
  });

  it('handles an Oxford-comma list ("... , y Band")', () => {
    const content = '<p>Os hablaremos de los nuevos trabajos de Opeth, Katatonia, y Anathema.</p>';

    expect(extractHighlightedBands(content)).toEqual(['Opeth', 'Katatonia', 'Anathema']);
  });

  it('returns an empty array when the first paragraph does not match the expected phrase', () => {
    expect(extractHighlightedBands('<p>Un párrafo cualquiera sin la fórmula esperada.</p>')).toEqual([]);
  });

  it('returns an empty array when there is no paragraph at all', () => {
    expect(extractHighlightedBands('<div>Sin párrafo</div>')).toEqual([]);
  });
});
