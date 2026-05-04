import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../monitoring', () => ({
  captureLoadBinsError: vi.fn(),
}));

import { fetchBins } from '../data';
import { captureLoadBinsError } from '../monitoring';

describe('fetchBins', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('captures and rethrows when the bin request fails', async () => {
    const error = new Error('network failed');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));

    await expect(fetchBins()).rejects.toThrow('network failed');
    expect(captureLoadBinsError).toHaveBeenCalledWith(error);
  });
});
