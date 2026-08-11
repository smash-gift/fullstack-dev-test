import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheService } from '../../src/modules/cache/cache.service';
import { Cache } from 'cache-manager';

describe('CacheService', () => {
  let service: CacheService;
  let cacheManager: jest.Mocked<Cache>;

  beforeEach(async () => {
    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  // ─── get() ─────────────────────────────────────────────────────────────────

  it('get() deve retornar valor cacheado quando a chave existe', async () => {
    const cachedValue = { suggestions: ['msg1', 'msg2'], cached: true };
    cacheManager.get.mockResolvedValue(cachedValue);

    const result = await service.get<typeof cachedValue>('test-key');

    expect(result).toEqual(cachedValue);
    expect(cacheManager.get).toHaveBeenCalledWith('test-key');
  });

  it('get() deve retornar null quando a chave não existe no cache', async () => {
    cacheManager.get.mockResolvedValue(undefined);

    const result = await service.get('non-existent-key');

    expect(result).toBeNull();
  });

  it('get() deve retornar null sem lançar exceção quando cacheManager falha (non-blocking)', async () => {
    cacheManager.get.mockRejectedValue(new Error('Redis connection failed'));

    const result = await service.get('failing-key');

    expect(result).toBeNull();
  });

  // ─── set() ─────────────────────────────────────────────────────────────────

  it('set() deve persistir valor e TTL no cacheManager', async () => {
    cacheManager.set.mockResolvedValue(undefined);

    const value = { suggestions: ['msg1', 'msg2'], cached: false };
    await service.set('cache-key', value, 86400000);

    expect(cacheManager.set).toHaveBeenCalledWith('cache-key', value, 86400000);
  });

  it('set() não deve lançar exceção quando cacheManager.set falha (non-blocking)', async () => {
    cacheManager.set.mockRejectedValue(new Error('Cache write failed'));

    await expect(
      service.set('failing-key', { data: 'value' }, 1000),
    ).resolves.not.toThrow();
  });
});
