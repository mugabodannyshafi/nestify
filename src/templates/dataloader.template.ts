import { toPascalCase } from '../utils/string.utils';

export function createDataLoaderTemplate(name: string): string {
  const className = toPascalCase(name);

  return `import DataLoader from 'dataloader';
import { Injectable } from '@nestjs/common';
import { ${className} } from '../schemas/${name}.schema';

@Injectable()
export class ${className}DataLoader {
  private readonly ${name}Loader = new DataLoader<string, ${className}>(
    async (ids: readonly string[]) => {
      // TODO: Implement batch loading logic
      // Example: const items = await this.${name}Service.findByIds(ids);
      // return ids.map(id => items.find(item => item.id === id) || null);
      return ids.map(() => null);
    }
  );

  private readonly ${name}sByUserLoader = new DataLoader<string, ${className}[]>(
    async (userIds: readonly string[]) => {
      // TODO: Implement batch loading by user ID
      // Example: const items = await this.${name}Service.findByUserIds(userIds);
      // return userIds.map(userId => items.filter(item => item.userId === userId));
      return userIds.map(() => []);
    }
  );

  async load${className}(id: string): Promise<${className} | null> {
    return this.${name}Loader.load(id);
  }

  async load${className}s(ids: string[]): Promise<(${className} | null)[]> {
    return this.${name}Loader.loadMany(ids);
  }

  async load${className}sByUser(userId: string): Promise<${className}[]> {
    return this.${name}sByUserLoader.load(userId);
  }

  clear${className}(id: string): void {
    this.${name}Loader.clear(id);
  }

  clearAll(): void {
    this.${name}Loader.clearAll();
    this.${name}sByUserLoader.clearAll();
  }
}
`;
}

export function createDataLoaderServiceTemplate(): string {
  return `import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';

@Injectable()
export class DataLoaderService {
  private loaders = new Map<string, DataLoader<any, any>>();

  createLoader<K, V>(
    key: string,
    batchLoadFn: DataLoader.BatchLoadFn<K, V>,
    options?: DataLoader.Options<K, V>
  ): DataLoader<K, V> {
    if (!this.loaders.has(key)) {
      this.loaders.set(key, new DataLoader(batchLoadFn, options));
    }
    return this.loaders.get(key)!;
  }

  getLoader<K, V>(key: string): DataLoader<K, V> | undefined {
    return this.loaders.get(key);
  }

  clearLoader(key: string): void {
    const loader = this.loaders.get(key);
    if (loader) {
      loader.clearAll();
    }
  }

  clearAllLoaders(): void {
    this.loaders.forEach(loader => loader.clearAll());
  }
}
`;
}
