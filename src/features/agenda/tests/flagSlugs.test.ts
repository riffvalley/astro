import { describe, expect, it } from 'vitest';

import { flagSlugsFor } from '../utils/flagSlugs';

describe('flagSlugsFor', () => {
  it('returns the single flag slug for a known calendar name', () => {
    expect(flagSlugsFor('Catalunya')).toEqual(['catalunya']);
  });

  it('returns both flags for the shared Ceuta y Melilla calendar', () => {
    expect(flagSlugsFor('Ceuta y Melilla')).toEqual(['ceuta', 'melilla']);
  });

  it('returns an empty array for an unknown calendar name', () => {
    expect(flagSlugsFor('Unknown Region')).toEqual([]);
  });
});
