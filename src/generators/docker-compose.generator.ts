import { ProjectConfig } from '../types/project.types';
import { Database } from '../constants/enums';

export class DockerComposeGenerator {
  static generate(config: ProjectConfig): Record<string, string> {
    if (!config.answers.useDocker || !config.answers.database) {
      return {};
    }

    return {
      Dockerfile: this.getDockerfile(config.answers.database),
      '.dockerignore': this.getDockerignore(),
      'docker-compose.yml': this.getDockerCompose(config.answers.database),
    };
  }

  private static getDockerfile(database: Database): string {
    const dbClient = {
      [Database.MYSQL]: 'mysql-client',
      [Database.POSTGRES]: 'postgresql-client',
      [Database.MONGODB]: 'mongodb-clients',
    }[database];

    return `FROM ubuntu:24.04
ARG NODE_VERSION=24
WORKDIR /home/app
RUN apt-get update
RUN apt install -y curl git \\
    && curl -sLS https://deb.nodesource.com/setup_$NODE_VERSION.x | bash - \\
    && apt-get install -y nodejs \\
    && apt-get install -y ${dbClient} \\
    && apt-get -y autoremove \\
    && apt-get -y clean
RUN npm i -g @nestjs/cli
CMD ["npm", "run", "start:dev"]`;
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

  private static getDockerCompose(database: Database): string {
    const baseService = `services:
  app:
    build: .
    restart: always
    ports:
      - '\${APP_PORT}:3000'
    platform: linux/amd64
    volumes:
      - '.:/home/app'
    command: bash -c "rm -rf node_modules dist && npm install && npm run start:dev"
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
      - '\${FORWARD_DB_PORT:-3306}:3306'
    environment:
      MYSQL_ROOT_PASSWORD: '\${DB_PASSWORD}'
      MYSQL_ROOT_HOST: '%'
      MYSQL_DATABASE: '\${DB_DATABASE}'
      MYSQL_USER: '\${DB_USERNAME}'
      MYSQL_PASSWORD: '\${DB_PASSWORD}'
      MYSQL_ALLOW_EMPTY_PASSWORD: 1
    volumes:
      - 'app-mysql:/var/lib/mysql'
    networks:
      - app-net
    healthcheck:
      test: ['CMD', 'mysqladmin', 'ping', '-p\${DB_PASSWORD}']
      retries: 10
      interval: 5s
      timeout: 5s
      start_period: 5s
  db-test:
    image: 'mysql/mysql-server:8.0'
    environment:
      MYSQL_ROOT_PASSWORD: '\${DB_PASSWORD}'
      MYSQL_ROOT_HOST: '%'
      MYSQL_DATABASE: '\${DB_DATABASE}_test'
      MYSQL_USER: '\${DB_USERNAME}'
      MYSQL_PASSWORD: '\${DB_PASSWORD}'
      MYSQL_ALLOW_EMPTY_PASSWORD: 1
    volumes:
      - 'app-mysql-testing:/var/lib/mysql'
    networks:
      - app-net
    healthcheck:
      test: ['CMD', 'mysqladmin', 'ping', '-p\${DB_PASSWORD}']
      retries: 10
      interval: 5s
      timeout: 5s
      start_period: 5s`,
      [Database.POSTGRES]: `
  db:
    image: 'postgres:16-alpine'
    ports:
      - '\${FORWARD_DB_PORT:-5432}:5432'
    environment:
      POSTGRES_USER: '\${DB_USERNAME}'
      POSTGRES_PASSWORD: '\${DB_PASSWORD}'
      POSTGRES_DB: '\${DB_DATABASE}'
    volumes:
      - 'app-postgres:/var/lib/postgresql/data'
    networks:
      - app-net
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U \${DB_USERNAME}']
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 5s
  db-test:
    image: 'postgres:16-alpine'
    environment:
      POSTGRES_USER: '\${DB_USERNAME}'
      POSTGRES_PASSWORD: '\${DB_PASSWORD}'
      POSTGRES_DB: '\${DB_DATABASE}_test'
    volumes:
      - 'app-postgres-testing:/var/lib/postgresql/data'
    networks:
      - app-net
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U \${DB_USERNAME}']
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 5s`,
      [Database.MONGODB]: `
  db:
    image: 'mongo:7'
    ports:
      - '\${FORWARD_DB_PORT:-27017}:27017'
    environment:
      MONGO_INITDB_ROOT_USERNAME: '\${DB_USERNAME}'
      MONGO_INITDB_ROOT_PASSWORD: '\${DB_PASSWORD}'
      MONGO_INITDB_DATABASE: '\${DB_DATABASE}'
    volumes:
      - 'app-mongo:/data/db'
    networks:
      - app-net
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/\${DB_DATABASE} --quiet
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 5s
  db-test:
    image: 'mongo:7'
    environment:
      MONGO_INITDB_ROOT_USERNAME: '\${DB_USERNAME}'
      MONGO_INITDB_ROOT_PASSWORD: '\${DB_PASSWORD}'
      MONGO_INITDB_DATABASE: '\${DB_DATABASE}_test'
    volumes:
      - 'app-mongo-testing:/data/db'
    networks:
      - app-net
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/\${DB_DATABASE}_test --quiet
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
