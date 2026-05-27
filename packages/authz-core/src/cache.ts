import { CacheProvider } from './types';

export class RequestCache implements CacheProvider {
  private cache = new Map<string, boolean>();

  get(key: string): boolean | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: boolean): void {
    this.cache.set(key, value);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}
