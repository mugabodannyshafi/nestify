import { Database, ORM } from './enums';

interface DatabaseEnvConfig {
  main: string;
  test: string;
}

export const getDatabaseEnvConfig = (
  projectName: string,
  database: Database,
  useDocker: boolean,
  orm?: ORM,
): DatabaseEnvConfig => {
  const dbHost = useDocker ? 'db' : 'localhost';
  const dbTestHost = useDocker ? 'db-test' : 'localhost';
  const redisHost = useDocker ? 'redis' : 'localhost';
  const redisTestHost = useDocker ? 'redis-test' : 'localhost';

  const configs: Record<Database, DatabaseEnvConfig> = {
    [Database.MYSQL]: {
      main: `# Application
APP_NAME=${projectName}
APP_PORT=3000
NODE_ENV=development

# Database - MySQL
DB_TYPE=mysql
DB_HOST=${dbHost}
DB_PORT=3306
DB_NAME=${projectName}
DB_USERNAME=root
DB_PASSWORD=root_password_123
${orm === ORM.PRISMA ? `DATABASE_URL=mysql://root:root_password_123@${dbHost}:3306/${projectName}` : ''}
${useDocker ? '\n# Database Forwarding Ports (for local access)\nFORWARD_DB_PORT=3307' : ''}

# Redis
REDIS_HOST=${redisHost}
REDIS_PORT=${useDocker ? '6379' : '6380'}
${useDocker ? 'FORWARD_REDIS_PORT=6380' : ''}

# JWT
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRES_IN=7d

# API
API_PREFIX=api
API_VERSION=1`,
      test: `# Testing Environment
APP_NAME=${projectName}
NODE_ENV=testing

# Test Database - MySQL
DB_TYPE=mysql
DB_HOST=${dbTestHost}
DB_PORT=3306
DB_NAME=${projectName}_test
DB_USERNAME=root
DB_PASSWORD=root_password_123
${orm === ORM.PRISMA ? `DATABASE_URL=mysql://root:root_password_123@${dbTestHost}:3306/${projectName}_test` : ''}

# Test Redis
REDIS_HOST=${redisTestHost}
REDIS_PORT=${useDocker ? '6379' : '6380'}

# JWT for testing
JWT_SECRET=test-secret-key
JWT_EXPIRES_IN=1d

# API
API_PREFIX=api
API_VERSION=1`,
    },
    [Database.POSTGRES]: {
      main: `# Application
APP_NAME=${projectName}
APP_PORT=3000
NODE_ENV=development

# Database - PostgreSQL
DB_TYPE=postgres
DB_HOST=${dbHost}
DB_PORT=5432
DB_NAME=${projectName}
DB_USERNAME=postgres
DB_PASSWORD=postgres_password_123
${orm === ORM.PRISMA ? `DATABASE_URL=postgresql://postgres:postgres_password_123@${dbHost}:5432/${projectName}?schema=public` : ''}
${useDocker ? '\n# Database Forwarding Ports (for local access)\nFORWARD_DB_PORT=5433' : ''}

# Redis
REDIS_HOST=${redisHost}
REDIS_PORT=${useDocker ? '6379' : '6380'}
${useDocker ? 'FORWARD_REDIS_PORT=6380' : ''}

# JWT
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRES_IN=7d

# API
API_PREFIX=api
API_VERSION=1`,
      test: `# Testing Environment
APP_NAME=${projectName}
NODE_ENV=testing

# Test Database - PostgreSQL
DB_TYPE=postgres
DB_HOST=${dbTestHost}
DB_PORT=5432
DB_NAME=${projectName}_test
DB_USERNAME=postgres
DB_PASSWORD=postgres_password_123
${orm === ORM.PRISMA ? `DATABASE_URL=postgresql://postgres:postgres_password_123@${dbTestHost}:5432/${projectName}_test?schema=public` : ''}

# Test Redis
REDIS_HOST=${redisTestHost}
REDIS_PORT=${useDocker ? '6379' : '6380'}

# JWT for testing
JWT_SECRET=test-secret-key
JWT_EXPIRES_IN=1d

# API
API_PREFIX=api
API_VERSION=1`,
    },
    [Database.MONGODB]: {
      main: `# Application
APP_NAME=${projectName}
APP_PORT=3000
NODE_ENV=development

# Database - MongoDB
DB_TYPE=mongodb
DB_HOST=${dbHost}
DB_PORT=27017
DB_NAME=${projectName}
DB_USERNAME=app_user
DB_PASSWORD=app_password_123
DATABASE_URL=mongodb://app_user:app_password_123@${dbHost}:27017/${projectName}?authSource=admin
${useDocker ? '\n# Database Forwarding Ports (for local access)\nFORWARD_DB_PORT=27018' : ''}

# Redis
REDIS_HOST=${redisHost}
REDIS_PORT=${useDocker ? '6379' : '6380'}
${useDocker ? 'FORWARD_REDIS_PORT=6380' : ''}

# JWT
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRES_IN=7d

# API
API_PREFIX=api
API_VERSION=1`,
      test: `# Testing Environment
APP_NAME=${projectName}
NODE_ENV=testing

# Test Database - MongoDB
DB_TYPE=mongodb
DB_HOST=${dbTestHost}
DB_PORT=27017
DB_NAME=${projectName}_test
DB_USERNAME=app_user
DB_PASSWORD=app_password_123
DATABASE_URL=mongodb://app_user:app_password_123@${dbTestHost}:${useDocker ? '27017' : '27018'}/${projectName}_test?authSource=admin

# Test Redis
REDIS_HOST=${redisTestHost}
REDIS_PORT=${useDocker ? '6379' : '6380'}

# JWT for testing
JWT_SECRET=test-secret-key
JWT_EXPIRES_IN=1d

# API
API_PREFIX=api
API_VERSION=1`,
    },
  };

  return configs[database];
};
