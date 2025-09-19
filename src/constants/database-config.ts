import { Database } from './enums';

interface DatabaseEnvConfig {
  main: string;
  test: string;
}

export const getDatabaseEnvConfig = (
  projectName: string,
  database: Database,
): DatabaseEnvConfig => {
  const configs: Record<Database, DatabaseEnvConfig> = {
    [Database.MYSQL]: {
      main: `# Application
APP_NAME=${projectName}
APP_PORT=3000
NODE_ENV=development

# Database - MySQL
DB_TYPE=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=${projectName}
DB_USERNAME=app_user
DB_PASSWORD=app_password_123

# Database Forwarding Ports (for local access)
FORWARD_DB_PORT=3307

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
FORWARD_REDIS_PORT=6380

# JWT
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRATION=7d

# API
API_PREFIX=api
API_VERSION=1`,
      test: `# Testing Environment
APP_NAME=${projectName}
NODE_ENV=testing

# Test Database - MySQL
DB_TYPE=mysql
DB_HOST=db-test
DB_PORT=3306
DB_DATABASE=${projectName}_test
DB_USERNAME=app_user
DB_PASSWORD=app_password_123

# Test Redis
REDIS_HOST=redis-test
REDIS_PORT=6379

# JWT for testing
JWT_SECRET=test-secret-key
JWT_EXPIRATION=1d

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
DB_HOST=db
DB_PORT=5432
DB_DATABASE=${projectName}
DB_USERNAME=app_user
DB_PASSWORD=app_password_123

# Database Forwarding Ports (for local access)
FORWARD_DB_PORT=5433

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
FORWARD_REDIS_PORT=6380

# JWT
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRATION=7d

# API
API_PREFIX=api
API_VERSION=1`,
      test: `# Testing Environment
APP_NAME=${projectName}
NODE_ENV=testing

# Test Database - PostgreSQL
DB_TYPE=postgres
DB_HOST=db-test
DB_PORT=5432
DB_DATABASE=${projectName}_test
DB_USERNAME=app_user
DB_PASSWORD=app_password_123

# Test Redis
REDIS_HOST=redis-test
REDIS_PORT=6379

# JWT for testing
JWT_SECRET=test-secret-key
JWT_EXPIRATION=1d

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
DB_HOST=db
DB_PORT=27017
DB_DATABASE=${projectName}
DB_USERNAME=app_user
DB_PASSWORD=app_password_123
DATABASE_URL=mongodb://app_user:app_password_123@db:27017/${projectName}?authSource=admin

# Database Forwarding Ports (for local access)
FORWARD_DB_PORT=27018

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
FORWARD_REDIS_PORT=6380

# JWT
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRATION=7d

# API
API_PREFIX=api
API_VERSION=1`,
      test: `# Testing Environment
APP_NAME=${projectName}
NODE_ENV=testing

# Test Database - MongoDB
DB_TYPE=mongodb
DB_HOST=db-test
DB_PORT=27017
DB_DATABASE=${projectName}_test
DB_USERNAME=app_user
DB_PASSWORD=app_password_123
DATABASE_URL=mongodb://app_user:app_password_123@db-test:27017/${projectName}_test?authSource=admin

# Test Redis
REDIS_HOST=redis-test
REDIS_PORT=6379

# JWT for testing
JWT_SECRET=test-secret-key
JWT_EXPIRATION=1d

# API
API_PREFIX=api
API_VERSION=1`,
    },
  };

  return configs[database];
};
