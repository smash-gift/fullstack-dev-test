import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    NestCacheModule.register({
      ttl: 86400000, // 24 hours in milliseconds
      max: 500, // Maximum number of items in LRU cache
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
