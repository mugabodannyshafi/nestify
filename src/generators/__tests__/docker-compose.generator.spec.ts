import { DockerComposeGenerator } from '../docker-compose.generator';
import { ProjectConfig } from '../../types/project.types';
import { Database, ORM, PackageManager } from '../../constants/enums';

describe('DockerComposeGenerator', () => {
  const createConfig = (
    useDocker: boolean,
    database?: Database,
    packageManager: PackageManager = PackageManager.NPM,
    orm?: ORM,
  ): ProjectConfig => ({
    name: 'test-project',
    path: '/test/path',
    answers: {
      packageManager,
      description: 'Test',
      author: 'Test Author',
      useDocker,
      database,
<<<<<<< HEAD
      orm,
=======
      useSwagger: false,
      useGraphQL: false,
      useGitHubActions: false,
>>>>>>> c615a6f (feat: implement complete GraphQL scaffolding with DataLoader support)
    },
  });

  describe('generate', () => {
    it('should return empty object when docker is not enabled', () => {
      const config = createConfig(false, Database.POSTGRES);
      const files = DockerComposeGenerator.generate(config);

      expect(files).toEqual({});
    });

    it('should return empty object when database is not selected', () => {
      const config = createConfig(true);
      const files = DockerComposeGenerator.generate(config);

      expect(files).toEqual({});
    });

    it('should generate all docker files when docker and database are enabled', () => {
      const config = createConfig(true, Database.POSTGRES);
      const files = DockerComposeGenerator.generate(config);

      expect(Object.keys(files)).toHaveLength(3);
    });
  });

  describe('Dockerfile generation', () => {
    it('should generate Dockerfile with postgresql-client for Postgres', () => {
      const config = createConfig(true, Database.POSTGRES);
      const files = DockerComposeGenerator.generate(config);

      expect(files.Dockerfile).toContain('postgresql-client');
      expect(files.Dockerfile).toContain('FROM ubuntu:24.04');
      expect(files.Dockerfile).toContain('NODE_VERSION=24');
      expect(files.Dockerfile).toContain('@nestjs/cli');
    });

    it('should generate Dockerfile with mysql-client for MySQL', () => {
      const config = createConfig(true, Database.MYSQL);
      const files = DockerComposeGenerator.generate(config);

      expect(files.Dockerfile).toContain('mysql-client');
    });

    it('should generate Dockerfile with mongodb-clients for MongoDB', () => {
      const config = createConfig(true, Database.MONGODB);
      const files = DockerComposeGenerator.generate(config);

      expect(files.Dockerfile).toContain('mongodb-clients');
    });
  });

  describe('.dockerignore generation', () => {
    it('should generate .dockerignore with essential patterns', () => {
      const config = createConfig(true, Database.POSTGRES);
      const files = DockerComposeGenerator.generate(config);

      expect(files['.dockerignore']).toContain('node_modules');
      expect(files['.dockerignore']).toContain('dist');
      expect(files['.dockerignore']).toContain('.git');
      expect(files['.dockerignore']).toContain('.env');
      expect(files['.dockerignore']).toContain('coverage');
    });
  });

  describe('docker-compose.yml generation', () => {
    it('should generate docker-compose for Postgres', () => {
      const config = createConfig(true, Database.POSTGRES);
      const files = DockerComposeGenerator.generate(config);
      const compose = files['docker-compose.yml'];

      expect(compose).toContain('postgres:16-alpine');
      expect(compose).toContain('app-postgres');
      expect(compose).toContain('pg_isready');
      expect(compose).toContain('POSTGRES_USER');
      expect(compose).toContain('db:');
      expect(compose).toContain('db-test:');
      expect(compose).toContain('redis:');
      expect(compose).toContain('redis-test:');
    });

    it('should generate docker-compose for MySQL', () => {
      const config = createConfig(true, Database.MYSQL);
      const files = DockerComposeGenerator.generate(config);
      const compose = files['docker-compose.yml'];

      expect(compose).toContain('mysql/mysql-server:8.0');
      expect(compose).toContain('app-mysql');
      expect(compose).toContain('mysqladmin');
      expect(compose).toContain('MYSQL_DATABASE');
    });

    it('should generate docker-compose for MongoDB', () => {
      const config = createConfig(true, Database.MONGODB);
      const files = DockerComposeGenerator.generate(config);
      const compose = files['docker-compose.yml'];

      expect(compose).toContain('mongo:7');
      expect(compose).toContain('app-mongo');
      expect(compose).toContain('mongosh');
      expect(compose).toContain('MONGO_INITDB_ROOT_USERNAME');
    });

    it('should include app service configuration', () => {
      const config = createConfig(true, Database.POSTGRES);
      const files = DockerComposeGenerator.generate(config);
      const compose = files['docker-compose.yml'];

      expect(compose).toContain('app:');
      expect(compose).toContain('build: .');
      expect(compose).toContain('restart: always');
      expect(compose).toContain('depends_on:');
      expect(compose).toContain('app-net');
    });

    it('should include prisma generate in startup command', () => {
      const config = createConfig(
        true,
        Database.POSTGRES,
        PackageManager.NPM,
        ORM.PRISMA,
      );
      const files = DockerComposeGenerator.generate(config);
      const compose = files['docker-compose.yml'];

      expect(compose).toContain('npx prisma generate');
      expect(compose).toContain(
        'npm install && npx prisma generate && npm run start:dev',
      );
    });

    it('should include redis services', () => {
      const config = createConfig(true, Database.POSTGRES);
      const files = DockerComposeGenerator.generate(config);
      const compose = files['docker-compose.yml'];

      expect(compose).toContain('redis:');
      expect(compose).toContain('redis-test:');
      expect(compose).toContain('redis:alpine');
      expect(compose).toContain('app-redis');
    });

    it('should include network and volume definitions', () => {
      const config = createConfig(true, Database.POSTGRES);
      const files = DockerComposeGenerator.generate(config);
      const compose = files['docker-compose.yml'];

      expect(compose).toContain('networks:');
      expect(compose).toContain('volumes:');
      expect(compose).toContain('driver: bridge');
      expect(compose).toContain('driver: local');
    });
  });

  describe('package manager support', () => {
    it('should use npm commands when packageManager is NPM', () => {
      const config = createConfig(
        true,
        Database.POSTGRES,
        PackageManager.NPM,
        ORM.PRISMA,
      );
      const files = DockerComposeGenerator.generate(config);

      expect(files.Dockerfile).toContain('CMD ["npm", "run", "start:dev"]');
      expect(files.Dockerfile).toContain('@nestjs/cli');
      expect(files['docker-compose.yml']).toContain('npm install');
      expect(files['docker-compose.yml']).toContain('npx prisma generate');
      expect(files['docker-compose.yml']).toContain('npm run start:dev');
    });

    it('should use yarn commands when packageManager is YARN', () => {
      const config = createConfig(
        true,
        Database.POSTGRES,
        PackageManager.YARN,
        ORM.PRISMA,
      );
      const files = DockerComposeGenerator.generate(config);

      expect(files.Dockerfile).toContain('CMD ["yarn", "run", "start:dev"]');
      expect(files.Dockerfile).not.toContain('@nestjs/cli');
      expect(files.Dockerfile).toContain(
        'corepack enable && corepack prepare yarn@stable --activate',
      );
      expect(files['docker-compose.yml']).toContain('yarn install');
      expect(files['docker-compose.yml']).toContain('yarn prisma generate');
      expect(files['docker-compose.yml']).toContain('yarn run start:dev');
    });

    it('should use pnpm commands when packageManager is PNPM', () => {
      const config = createConfig(
        true,
        Database.POSTGRES,
        PackageManager.PNPM,
        ORM.PRISMA,
      );
      const files = DockerComposeGenerator.generate(config);

      expect(files.Dockerfile).toContain('CMD ["pnpm", "run", "start:dev"]');
      expect(files.Dockerfile).not.toContain('@nestjs/cli');
      expect(files.Dockerfile).toContain(
        'corepack enable && corepack prepare pnpm@latest --activate',
      );
      expect(files['docker-compose.yml']).toContain('pnpm install');
      expect(files['docker-compose.yml']).toContain('pnpm prisma generate');
      expect(files['docker-compose.yml']).toContain('pnpm run start:dev');
    });
  });
});
