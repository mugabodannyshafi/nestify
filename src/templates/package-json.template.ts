import { ORM } from '../constants/enums';

export function createPackageJson(
  projectName: string,
  description: string,
  author: string,
  orm?: ORM,
): string {
  const scripts: Record<string, string> = {
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
  };

  // Add Prisma scripts if using Prisma
  if (orm === ORM.PRISMA) {
    scripts['prisma:generate'] = 'prisma generate';
    scripts['prisma:migrate'] = 'prisma migrate dev';
    scripts['prisma:studio'] = 'prisma studio';
    scripts['prisma:seed'] = 'ts-node prisma/seed.ts';
  }

  const packageJson = {
    name: projectName,
    version: '0.0.1',
    description: description,
    author: author,
    private: true,
    license: 'UNLICENSED',
    scripts: scripts,
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
