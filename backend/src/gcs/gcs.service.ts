import { Injectable, Logger } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';

/**
 * Service for reading files from Google Cloud Storage at runtime.
 * Uses Application Default Credentials (ADC) automatically — no service account
 * key file needed when running on Cloud Run.
 *
 * Files are cached in memory after the first read to avoid repeated GCS calls
 * on every AI generation request.
 */
@Injectable()
export class GcsService {
  private readonly logger = new Logger(GcsService.name);
  private readonly storage: Storage;
  private readonly bucketName: string;
  private readonly cache = new Map<string, string>();

  constructor() {
    // ADC is automatically picked up from the environment:
    // - On Cloud Run: uses the attached service account identity
    // - On local dev: uses `gcloud auth application-default login` credentials
    this.storage = new Storage();
    this.bucketName = process.env.GCS_BUCKET_NAME || '';

    if (!this.bucketName) {
      this.logger.warn(
        'GCS_BUCKET_NAME is not set. GCS file reads will be skipped and return empty strings. ' +
        'AI generation will work but without prd.md / standard.md / instruction.md context.',
      );
    }
  }

  /**
   * Reads a file from the configured GCS bucket.
   * Returns a cached version on subsequent calls.
   * Returns an empty string if the bucket is not configured or the file is not found.
   */
  async readFile(filename: string): Promise<string> {
    if (!this.bucketName) {
      return '';
    }

    // Return cached version if available
    if (this.cache.has(filename)) {
      this.logger.debug(`Cache hit for ${filename}`);
      return this.cache.get(filename)!;
    }

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(filename);
      const [contents] = await file.download();
      const text = contents.toString('utf-8');
      this.cache.set(filename, text);
      this.logger.log(`Successfully read "${filename}" from GCS bucket "${this.bucketName}" (${text.length} chars)`);
      return text;
    } catch (error: any) {
      this.logger.warn(
        `Could not read "${filename}" from GCS bucket "${this.bucketName}": ${error.message}. ` +
        'Returning empty string — AI generation will proceed without this context file.',
      );
      return '';
    }
  }

  /**
   * Invalidates the in-memory cache.
   * Call this if a file in GCS has been updated and you want the next read
   * to fetch the fresh version without restarting the container.
   *
   * @param filename - If provided, only invalidates cache for that file.
   *                   If omitted, clears the entire cache.
   */
  invalidateCache(filename?: string): void {
    if (filename) {
      this.cache.delete(filename);
      this.logger.log(`Cache invalidated for "${filename}"`);
    } else {
      this.cache.clear();
      this.logger.log('Entire GCS file cache has been invalidated');
    }
  }
}
