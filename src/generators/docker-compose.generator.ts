import { ProjectConfig } from '../types/project.types';
import { Database, PackageManager } from '../constants/enums';

export class DockerComposeGenerator {
  static generate(config: ProjectConfig): Record<string, string> {
    if (!config.answers.useDocker || !config.answers.database) {
      return {};
    }

    return {
      Dockerfile: this.getDockerfile(
        config.answers.database,
        config.answers.packageManager,
      ),
      '.dockerignore': this.getDockerignore(),
      'docker-compose.yml': this.getDockerCompose(
        config.answers.database,
        config.answers.packageManager,
      ),
    };
  }

  private static getDockerfile(
    database: Database,
    packageManager: PackageManager,
  ): string {
    const dbClient = {
      [Database.MYSQL]: 'mysql-client',
      [Database.POSTGRES]: 'postgresql-client',
      [Database.MONGODB]: 'mongodb-clients',
    }[database];

    const installGlobalCLI =
      packageManager === PackageManager.NPM ? 'RUN npm i -g @nestjs/cli' : '';

    const packageManagerSetup = {
      [PackageManager.NPM]: '',
      [PackageManager.YARN]:
        'RUN corepack enable && corepack prepare yarn@stable --activate',
      [PackageManager.PNPM]:
        'RUN corepack enable && corepack prepare pnpm@latest --activate',
    }[packageManager];

    return `FROM ubuntu:24.04
ARG NODE_VERSION=24
WORKDIR /home/app
RUN apt-get update
RUN apt install -y curl git \\
    && curl -sLS https://deb.nodesource.com/setup_$NODE_VERSION.x | bash - \\
    && apt-get install -y nodejs \\
    && apt-get install -y ${dbClient} \\
    && apt-get -y autoremove \\
    && apt-get -y clean${
      packageManagerSetup ? `\n${packageManagerSetup}` : ''
    }${installGlobalCLI ? `\n${installGlobalCLI}` : ''}
CMD ["${packageManager}", "run", "start:dev"]`;
  }

  private static getDockerignore(): string {
    return `node_modules
npm-debug.log
dist
.git
.gitignore
README.md
.env
.env.testing
.env.production
coverage
.nyc_output
.github
.vscode
.idea
*.log`;
  }

  private static getDockerCompose(
    database: Database,
    packageManager: PackageManager,
  ): string {
    const envVar = (name: string) => '${' + name + '}';
    const envVarWithDefault = (name: string, fallback: string) =>
      '${' + name + ':-' + fallback + '}';

    const installCmd =
      packageManager === PackageManager.NPM
        ? 'npm install'
        : packageManager === PackageManager.YARN
          ? 'yarn install'
          : 'pnpm install';

    const prismaCmd =
      packageManager === PackageManager.NPM
        ? 'npx prisma generate'
        : packageManager === PackageManager.YARN
          ? 'yarn prisma generate'
          : 'pnpm prisma generate';

    const startCmd = `${packageManager} run start:dev`;

    const baseService = `services:
  app:
    build: .
    restart: always
    ports:
      - '\${APP_PORT}:3000'
    platform: linux/amd64
    volumes:
      - '.:/home/app'
    command: bash -c "rm -rf node_modules dist && ${installCmd} && ${prismaCmd} && ${startCmd}"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - app-net`;

    const redisServices = `
  redis:
    image: 'redis:alpine'
    ports:
      - '\${FORWARD_REDIS_PORT:-6379}:6379'
    volumes:
      - 'app-redis:/data'
    networks:
      - app-net
    healthcheck:
      test:
        - CMD
        - redis-cli
        - ping
      retries: 3
      timeout: 5s
  redis-test:
    image: 'redis:alpine'
    volumes:
      - 'app-redis-testing:/data'
    networks:
      - app-net
    healthcheck:
      test:
        - CMD
        - redis-cli
        - ping
      retries: 3
      timeout: 5s`;

    const networkAndVolumesBase = `
networks:
  app-net:
    driver: bridge
volumes:`;

    const volumeDefinitions = {
      [Database.MYSQL]: `
  app-mysql:
    driver: local
  app-mysql-testing:
    driver: local
  app-redis:
    driver: local
  app-redis-testing:
    driver: local`,
      [Database.POSTGRES]: `
  app-postgres:
    driver: local
  app-postgres-testing:
    driver: local
  app-redis:
    driver: local
  app-redis-testing:
    driver: local`,
      [Database.MONGODB]: `
  app-mongo:
    driver: local
  app-mongo-testing:
    driver: local
  app-redis:
    driver: local
  app-redis-testing:
    driver: local`,
    };

    const dbServices = {
      [Database.MYSQL]: `
  db:
    image: 'mysql/mysql-server:8.0'
    ports:
      - '${envVarWithDefault('FORWARD_DB_PORT', '3306')}:3306'
    environment:
      MYSQL_ROOT_PASSWORD: ${envVar('DB_PASSWORD')}
      MYSQL_ROOT_HOST: '%'
      MYSQL_DATABASE: ${envVar('DB_NAME')}
      MYSQL_ALLOW_EMPTY_PASSWORD: 0
    volumes:
      - 'app-mysql:/var/lib/mysql'
    networks:
      - app-net
    healthcheck:
      test: ['CMD', 'mysqladmin', 'ping', "-p${envVar('DB_PASSWORD')}"]
      retries: 10
      interval: 5s
      timeout: 5s
      start_period: 5s
  db-test:
    image: 'mysql/mysql-server:8.0'
    environment:
      MYSQL_ROOT_PASSWORD: ${envVar('DB_PASSWORD')}
      MYSQL_ROOT_HOST: '%'
      MYSQL_DATABASE: ${envVar('DB_NAME')}_test
      MYSQL_ALLOW_EMPTY_PASSWORD: 0
    volumes:
      - 'app-mysql-testing:/var/lib/mysql'
    networks:
      - app-net
    healthcheck:
      test: ['CMD', 'mysqladmin', 'ping', "-p${envVar('DB_PASSWORD')}"]
      retries: 10
      interval: 5s
      timeout: 5s
      start_period: 5s`,
      [Database.POSTGRES]: `
  db:
    image: 'postgres:16-alpine'
    ports:
      - '${envVarWithDefault('FORWARD_DB_PORT', '5432')}:5432'
    environment:
      POSTGRES_USER: ${envVar('DB_USERNAME')}
      POSTGRES_PASSWORD: ${envVar('DB_PASSWORD')}
      POSTGRES_DB: ${envVar('DB_NAME')}
    volumes:
      - 'app-postgres:/var/lib/postgresql/data'
    networks:
      - app-net
    healthcheck:
      test: ['CMD-SHELL', "pg_isready -U ${envVar('DB_USERNAME')} -d ${envVar('DB_NAME')}"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 5s
  db-test:
    image: 'postgres:16-alpine'
    environment:
      POSTGRES_USER: ${envVar('DB_USERNAME')}
      POSTGRES_PASSWORD: ${envVar('DB_PASSWORD')}
      POSTGRES_DB: ${envVar('DB_NAME')}_test
    volumes:
      - 'app-postgres-testing:/var/lib/postgresql/data'
    networks:
      - app-net
    healthcheck:
      test: ['CMD-SHELL', "pg_isready -U ${envVar('DB_USERNAME')} -d ${envVar('DB_NAME')}_test"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 5s`,
      [Database.MONGODB]: `
  db:
    image: 'mongo:7'
    ports:
      - '${envVarWithDefault('FORWARD_DB_PORT', '27017')}:27017'
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${envVar('DB_USERNAME')}
      MONGO_INITDB_ROOT_PASSWORD: ${envVar('DB_PASSWORD')}
      MONGO_INITDB_NAME: ${envVar('DB_NAME')}
    volumes:
      - 'app-mongo:/data/db'
    networks:
      - app-net
    healthcheck:
      test: ['CMD-SHELL', "echo 'db.runCommand(\"ping\").ok' | mongosh localhost:27017/${envVar('DB_NAME')} --quiet"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 5s
  db-test:
    image: 'mongo:7'
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${envVar('DB_USERNAME')}
      MONGO_INITDB_ROOT_PASSWORD: ${envVar('DB_PASSWORD')}
      MONGO_INITDB_NAME: ${envVar('DB_NAME')}_test
    volumes:
      - 'app-mongo-testing:/data/db'
    networks:
      - app-net
    healthcheck:
      test: ['CMD-SHELL', "echo 'db.runCommand(\"ping\").ok' | mongosh localhost:27017/${envVar('DB_NAME')}_test --quiet"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 5s`,
    };

    return (
      baseService +
      dbServices[database] +
      redisServices +
      networkAndVolumesBase +
      volumeDefinitions[database]
    );
  }
}
