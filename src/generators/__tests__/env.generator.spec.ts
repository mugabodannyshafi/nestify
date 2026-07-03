import { EnvGenerator } from '../env.generator';
import { ProjectConfig } from '../../types/project.types';
import { Database, PackageManager } from '../../constants/enums';
import * as databaseConfig from '../../constants/database-config';

jest.mock('../../constants/database-config');

describe('EnvGenerator', () => {
  const createConfig = (
    useDocker: boolean,
    database?: Database,
  ): ProjectConfig => ({
    name: 'test-app',
    path: '/test/path',
    answers: {
      packageManager: PackageManager.NPM,
      description: 'Test',
      author: 'Test Author',
      useDocker,
      database,
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generate', () => {
    it('should generate 4 env files', () => {
      const config = createConfig(false);
      const files = EnvGenerator.generate(config);
      const keys = Object.keys(files);

      expect(keys).toContain('.env');
      expect(keys).toContain('.env.example');
      expect(keys).toContain('.env.testing');
      expect(keys).toContain('.env.testing.example');
      expect(keys).toHaveLength(4);
    });

    it('should use database config when docker and database are enabled', () => {
      const mockDbConfig = {
        main: 'DB_HOST=db\nDB_PORT=5432',
        test: 'DB_HOST=db-test\nDB_PORT=5432',
      };

      (databaseConfig.getDatabaseEnvConfig as jest.Mock).mockReturnValue(
        mockDbConfig,
      );

      const config = createConfig(true, Database.POSTGRES);
      const files = EnvGenerator.generate(config);

      expect(databaseConfig.getDatabaseEnvConfig).toHaveBeenCalledWith(
        'test-app',
        Database.POSTGRES,
        true,
        undefined, // orm parameter
      );
      expect(files['.env']).toBe(mockDbConfig.main);
      expect(files['.env.example']).toBe(mockDbConfig.main);
      expect(files['.env.testing']).toBe(mockDbConfig.test);
      expect(files['.env.testing.example']).toBe(mockDbConfig.test);
    });

    it('should use standard env when docker is disabled', () => {
      const config = createConfig(false);
      const files = EnvGenerator.generate(config);

      expect(databaseConfig.getDatabaseEnvConfig).not.toHaveBeenCalled();
      expect(files['.env']).toContain('NODE_ENV=development');
      expect(files['.env']).toContain('mongodb://localhost:27017/test-app');
    });

    it('should use standard env when database is not selected', () => {
      const config = createConfig(true);
      const files = EnvGenerator.generate(config);

      expect(databaseConfig.getDatabaseEnvConfig).not.toHaveBeenCalled();
      expect(files['.env']).toContain('NODE_ENV=development');
    });
  });

  describe('standard env files', () => {
    it('should generate correct standard .env file', () => {
      const config = createConfig(false);
      const files = EnvGenerator.generate(config);
      const env = files['.env'];

      expect(env).toContain('NODE_ENV=development');
      expect(env).toContain('PORT=3000');
      expect(env).toContain('DATABASE_URL=mongodb://localhost:27017/test-app');
      expect(env).toContain('JWT_SECRET=your-secret-key-here');
      expect(env).toContain('JWT_EXPIRES_IN=7d');
      expect(env).toContain('API_PREFIX=api');
      expect(env).toContain('API_VERSION=1');
    });

    it('should generate correct testing .env file', () => {
      const config = createConfig(false);
      const files = EnvGenerator.generate(config);
      const testEnv = files['.env.testing'];

      expect(testEnv).toContain('NODE_ENV=testing');
      expect(testEnv).toContain('PORT=3001');
      expect(testEnv).toContain(
        'DATABASE_URL=mongodb://localhost:27017/test-app-test',
      );
      expect(testEnv).toContain('JWT_SECRET=test-secret-key');
      expect(testEnv).toContain('JWT_EXPIRES_IN=1d');
      expect(testEnv).toContain('API_PREFIX=api');
      expect(testEnv).toContain('API_VERSION=1');
    });

    it('should have .env and .env.example with same content', () => {
      const config = createConfig(false);
      const files = EnvGenerator.generate(config);

      expect(files['.env']).toBe(files['.env.example']);
    });

    it('should have .env.testing and .env.testing.example with same content', () => {
      const config = createConfig(false);
      const files = EnvGenerator.generate(config);

      expect(files['.env.testing']).toBe(files['.env.testing.example']);
    });

    it('should use project name in database URLs', () => {
      const config: ProjectConfig = {
        name: 'my-custom-app',
        path: '/test/path',
        answers: {
          packageManager: PackageManager.NPM,
          description: 'Test',
          author: 'Test Author',
          useDocker: false,
        },
      };

      const files = EnvGenerator.generate(config);

      expect(files['.env']).toContain(
        'mongodb://localhost:27017/my-custom-app',
      );
      expect(files['.env.testing']).toContain(
        'mongodb://localhost:27017/my-custom-app-test',
      );
    });
  });
});
