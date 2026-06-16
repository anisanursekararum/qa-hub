import { Global, Module } from '@nestjs/common';
import { GcsService } from './gcs.service';

/**
 * Global module for Google Cloud Storage integration.
 * Marked as @Global so GcsService is available in all modules
 * without needing to be explicitly imported.
 */
@Global()
@Module({
  providers: [GcsService],
  exports: [GcsService],
})
export class GcsModule {}
