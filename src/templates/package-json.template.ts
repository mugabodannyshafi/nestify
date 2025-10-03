// src/templates/package-json.template.ts
import { Database } from '../constants/enums';

export function createPackageJson(
  projectName: string,
  description: string,
  author: string,
  useSwagger: boolean = true,
  database?: Database,
): string {
  const dependencies: Record<string, string> = {
    '@nestjs/common': '^10.0.0',
    '@nestjs/core': '^10.0.0',
    '@nestjs/platform-express': '^10.0.0',
    'reflect-metadata': '^0.2.0',
    rxjs: '^7.8.1',
    '@nestjs/config': '^3.0.0',
  };

  if (useSwagger) {
    dependencies['@nestjs/swagger'] = '^7.3.0';
  }

  if (database === Database.MYSQL) {
    dependencies['@nestjs/typeorm'] = '^10.0.0';
    dependencies['mysql2'] = '^3.3.0';
    dependencies['typeorm'] = '^0.3.17';
  } else if (database === Database.POSTGRES) {
    dependencies['@nestjs/typeorm'] = '^10.0.0';
    dependencies['pg'] = '^8.9.0';
    dependencies['typeorm'] = '^0.3.17';
  } else if (database === Database.MONGODB) {
    dependencies['@nestjs/mongoose'] = '^10.0.0';
    dependencies['mongoose'] = '^7.3.4';
  }

  const packageJson = {
    name: projectName,
    version: '0.0.1',
    description: description,
    author: author,
    private: true,
    license: 'UNLICENSED',
    scripts: {
      build: 'nest build',
      format: 'prettier --write "src/**/*.ts" "test/**/*.ts"',
      start: 'nest start',
      'start:dev': 'nest start --watch',
      'start:debug': 'nest start --debug --watch',
      'start:prod': 'node dist/main',
      lint: 'eslint "{src,apps,libs,test}/**/*.ts" --fix',
      test: 'jest',
      'test:watch': 'jest --watch',
      'test:cov': 'jest --coverage',
      'test:debug':
        'node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand',
      'test:e2e': 'jest --config ./test/jest-e2e.json',
    },
    dependencies: {},
    devDependencies: {},
    jest: {
      moduleFileExtensions: ['js', 'json', 'ts'],
      rootDir: 'src',
      testRegex: '.*\\.spec\\.ts$',
      transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
      },
      collectCoverageFrom: ['**/*.(t|j)s'],
      coverageDirectory: '../coverage',
      testEnvironment: 'node',
    },
  };

  return JSON.stringify(packageJson, null, 2);
}
