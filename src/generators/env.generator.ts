import { ProjectConfig } from '../types/project.types';
import { getDatabaseEnvConfig } from '../constants/database-config';

export class EnvGenerator {
  static generate(config: ProjectConfig): Record<string, string> {
    const files: Record<string, string> = {};

    if (config.answers.database) {
      const dbConfig = getDatabaseEnvConfig(
        config.name,
        config.answers.database,
        config.answers.useDocker || false,
        config.answers.orm,
      );
      files['.env'] = dbConfig.main;
      files['.env.example'] = dbConfig.main;
      files['.env.testing'] = dbConfig.test;
      files['.env.testing.example'] = dbConfig.test;
    } else {
      files['.env'] = this.getStandardEnv(config.name);
      files['.env.example'] = this.getStandardEnv(config.name);
      files['.env.testing'] = this.getTestingEnv(config.name);
      files['.env.testing.example'] = this.getTestingEnv(config.name);
    }

    return files;
  }

  private static getStandardEnv(projectName: string): string {
    return `# Environment variables
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=mongodb://localhost:27017/${projectName}

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# API
API_PREFIX=api
API_VERSION=1`;
  }

  private static getTestingEnv(projectName: string): string {
    return `# Testing Environment variables
NODE_ENV=testing
PORT=3001

# Test Database
DATABASE_URL=mongodb://localhost:27017/${projectName}-test

# JWT for testing
JWT_SECRET=test-secret-key
JWT_EXPIRES_IN=1d

# API
API_PREFIX=api
API_VERSION=1`;
  }
}
