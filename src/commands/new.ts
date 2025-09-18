import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';
import { exec } from 'child_process';
import { promisify } from 'util';
import inquirer from 'inquirer';
import { createProjectStructure } from '../utils/project-structure';
import { createPackageJson } from '../templates/package-json.template';
import { createTsConfig } from '../templates/tsconfig.template';
import { createMainTs } from '../templates/main.template';
import { createAppModule } from '../templates/app-module.template';
import { createAppController } from '../templates/app-controller.template';
import { createAppService } from '../templates/app-service.template';
import { createAppControllerSpec } from '../templates/app-controller.spec.template';
import { createAppServiceSpec } from '../templates/app-service.spec.template';
import { createAppE2ESpec } from '../templates/app-e2e-spec.template';
import { createJestE2EConfig } from '../templates/jest-e2e-config.template';
import { execSync } from 'child_process';

const execAsync = promisify(exec);

interface NewCommandOptions {
  packageManager: string;
  skipInstall: boolean;
}

export async function newCommand(
  projectName: string,
  options: NewCommandOptions,
) {
  const spinner = ora();

  try {
    // Check if directory exists
    const projectPath = path.resolve(process.cwd(), projectName);

    if (fs.existsSync(projectPath)) {
      console.log(chalk.red(`❌ Directory ${projectName} already exists!`));
      process.exit(1);
    }

    // Ask for project details
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'packageManager',
        message: 'Which package manager would you like to use?',
        choices: ['npm', 'yarn', 'pnpm'],
        default: options.packageManager || 'npm',
      },
      {
        type: 'input',
        name: 'description',
        message: 'Project description:',
        default: 'A NestJS application',
      },
      {
        type: 'input',
        name: 'author',
        message: 'Author:',
        default: '',
      },
      {
        type: 'confirm',
        name: 'useDocker',
        message: 'Add Docker support?',
        default: false,
      },
      {
        type: 'list',
        name: 'database',
        message: 'Which database would you like to use with Docker?',
        choices: ['mysql', 'postgres', 'mongodb'],
        default: 'mysql',
        when: (answers) => answers.useDocker,
      },
      {
        type: 'confirm',
        name: 'useSwagger',
        message: 'Add Swagger documentation?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'useGitHubActions',
        message: 'Add GitHub Actions for CI/CD?',
        default: true,
      },
    ]);

    console.log(chalk.green(`\n📁 Creating project: ${projectName}\n`));

    // Create project directory
    spinner.start('Creating project structure...');
    fs.ensureDirSync(projectPath);

    // Create folder structure
    createProjectStructure(projectPath);

    // Create package.json
    const packageJsonContent = createPackageJson(
      projectName,
      answers.description,
      answers.author,
      answers.useSwagger,
    );
    fs.writeFileSync(
      path.join(projectPath, 'package.json'),
      packageJsonContent,
    );

    // Create tsconfig.json
    fs.writeFileSync(path.join(projectPath, 'tsconfig.json'), createTsConfig());

    // Create tsconfig.build.json
    fs.writeFileSync(
      path.join(projectPath, 'tsconfig.build.json'),
      JSON.stringify(
        {
          extends: './tsconfig.json',
          exclude: ['node_modules', 'test', 'dist', '**/*spec.ts'],
        },
        null,
        2,
      ),
    );

    // Create src files
    fs.writeFileSync(
      path.join(projectPath, 'src/main.ts'),
      createMainTs(answers.useSwagger),
    );
    fs.writeFileSync(
      path.join(projectPath, 'src/app.module.ts'),
      createAppModule(),
    );
    fs.writeFileSync(
      path.join(projectPath, 'src/app.controller.ts'),
      createAppController(),
    );
    fs.writeFileSync(
      path.join(projectPath, 'src/app.controller.spec.ts'),
      createAppControllerSpec(),
    );
    fs.writeFileSync(
      path.join(projectPath, 'src/app.service.ts'),
      createAppService(),
    );
    fs.writeFileSync(
      path.join(projectPath, 'src/app.service.spec.ts'),
      createAppServiceSpec(),
    );

    const testPath = path.join(projectPath, 'test');
    fs.ensureDirSync(testPath);

    // Create app.e2e-spec.ts
    fs.writeFileSync(
      path.join(testPath, 'app.e2e-spec.ts'),
      createAppE2ESpec(),
    );

    // Create jest-e2e.json
    fs.writeFileSync(
      path.join(testPath, 'jest-e2e.json'),
      createJestE2EConfig(),
    );

    // Create environment files based on database selection
    let envContent = '';
    let envTestingContent = '';

    if (answers.useDocker) {
      // Docker environment with database configuration
      const dbConfig: any = {
        mysql: {
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
        postgres: {
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
        mongodb: {
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

      envContent = dbConfig[answers.database].main;
      envTestingContent = dbConfig[answers.database].test;
    } else {
      // Standard environment without Docker
      envContent = `# Environment variables
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=mongodb://localhost:27017/${projectName}

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=7d

# API
API_PREFIX=api
API_VERSION=1
`;
      envTestingContent = `# Testing Environment variables
NODE_ENV=testing
PORT=3001

# Test Database
DATABASE_URL=mongodb://localhost:27017/${projectName}-test

# JWT for testing
JWT_SECRET=test-secret-key
JWT_EXPIRATION=1d

# API
API_PREFIX=api
API_VERSION=1
`;
    }

    fs.writeFileSync(path.join(projectPath, '.env'), envContent);
    fs.writeFileSync(path.join(projectPath, '.env.example'), envContent);
    fs.writeFileSync(path.join(projectPath, '.env.testing'), envTestingContent);
    fs.writeFileSync(
      path.join(projectPath, '.env.testing.example'),
      envTestingContent,
    );

    // Create .gitignore
    const gitignoreContent = `# Dependencies
/dist
/node_modules
/build

# Environment
.env
.env.testing
.env.production

# IDE
.vscode/
.idea/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# OS
.DS_Store
Thumbs.db

# Tests
coverage/
.nyc_output/

# Temp files
*.tmp
*.swp
`;
    fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignoreContent);

    // Create .prettierrc
    const prettierContent = {
      singleQuote: true,
      trailingComma: 'all',
      printWidth: 100,
      tabWidth: 2,
      semi: true,
      bracketSpacing: true,
      arrowParens: 'always',
      endOfLine: 'auto',
    };
    fs.writeFileSync(
      path.join(projectPath, '.prettierrc'),
      JSON.stringify(prettierContent, null, 2),
    );

    // Create eslint.config.mjs
    const eslintConfigContent = `// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', '.prettierrc', 'eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    plugins: {
      prettier: prettierPlugin,
    },
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_' 
      }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      
      // Prettier integration
      'prettier/prettier': ['error', {
        endOfLine: 'auto',
      }],
      
      // General rules
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    },
  },
);
`;
    fs.writeFileSync(
      path.join(projectPath, 'eslint.config.mjs'),
      eslintConfigContent,
    );

    // Create README
    const readmeContent = `# ${projectName}

${answers.description}

## Installation

\`\`\`bash
${answers.packageManager === 'yarn' ? 'yarn' : answers.packageManager === 'pnpm' ? 'pnpm install' : 'npm install'}
\`\`\`

## Running the app

${answers.useDocker ? '### With Docker\n\n```bash\n# Start with docker-compose\ndocker-compose up\n\n# Start in detached mode\ndocker-compose up -d\n```\n\n### Without Docker\n' : ''}\`\`\`bash
# development
${answers.packageManager} run start

# watch mode
${answers.packageManager} run start:dev

# production mode
${answers.packageManager} run start:prod
\`\`\`

## Test

\`\`\`bash
# unit tests
${answers.packageManager} run test

# e2e tests
${answers.packageManager} run test:e2e

# test coverage
${answers.packageManager} run test:cov
\`\`\`

${answers.useGitHubActions ? '## CI/CD\n\nThis project includes GitHub Actions workflows for:\n- Automated testing on push and pull requests\n- Code quality checks (linting, formatting)\n- Test coverage reporting\n' : ''}
---
Generated with nestForge 🔨
`;
    fs.writeFileSync(path.join(projectPath, 'README.md'), readmeContent);

    // Create GitHub Actions workflow if requested
    if (answers.useGitHubActions) {
      const workflowsPath = path.join(projectPath, '.github/workflows');
      fs.ensureDirSync(workflowsPath);

      const testsYmlContent = `name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - uses: actions/checkout@v3

    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: \${{ matrix.node-version }}
        cache: '${answers.packageManager}'

    - name: Install dependencies
      run: ${answers.packageManager === 'yarn' ? 'yarn --frozen-lockfile' : answers.packageManager === 'pnpm' ? 'pnpm install --frozen-lockfile' : 'npm ci'}

    - name: Run linter
      run: ${answers.packageManager} run lint

    - name: Run unit tests
      run: ${answers.packageManager} run test:cov

    - name: Run e2e tests
      run: ${answers.packageManager} run test:e2e

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/coverage-final.json
        flags: unittests
        name: codecov-umbrella
        fail_ci_if_error: false

  build:
    runs-on: ubuntu-latest
    needs: test

    steps:
    - uses: actions/checkout@v3

    - name: Use Node.js 18.x
      uses: actions/setup-node@v3
      with:
        node-version: 18.x
        cache: '${answers.packageManager}'

    - name: Install dependencies
      run: ${answers.packageManager === 'yarn' ? 'yarn --frozen-lockfile' : answers.packageManager === 'pnpm' ? 'pnpm install --frozen-lockfile' : 'npm ci'}

    - name: Build application
      run: ${answers.packageManager} run build

    - name: Check build output
      run: |
        if [ ! -d "dist" ]; then
          echo "Build failed: dist directory not found"
          exit 1
        fi
`;

      fs.writeFileSync(path.join(workflowsPath, 'tests.yml'), testsYmlContent);
    }

    // Create Docker files if requested
    if (answers.useDocker) {
      // Simple Dockerfile as per your preference
      const dockerfileContent = `FROM ubuntu:24.04
ARG NODE_VERSION=24
WORKDIR /home/app
RUN apt-get update
RUN apt install -y curl git \\
    && curl -sLS https://deb.nodesource.com/setup_$NODE_VERSION.x | bash - \\
    && apt-get install -y nodejs \\
    && apt-get install -y ${answers.database === 'mysql' ? 'mysql-client' : answers.database === 'postgres' ? 'postgresql-client' : 'mongodb-clients'} \\
    && apt-get -y autoremove \\
    && apt-get -y clean
RUN npm i -g @nestjs/cli
CMD ["npm", "run", "start:dev"]
`;
      fs.writeFileSync(path.join(projectPath, 'Dockerfile'), dockerfileContent);

      // Create .dockerignore
      const dockerignoreContent = `node_modules
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
*.log
`;
      fs.writeFileSync(
        path.join(projectPath, '.dockerignore'),
        dockerignoreContent,
      );

      // Create docker-compose.yml based on database selection
      let dockerComposeContent = '';

      if (answers.database === 'mysql') {
        dockerComposeContent = `services:
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
      - app-net
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
      start_period: 5s
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
      timeout: 5s
networks:
  app-net:
    driver: bridge
volumes:
  app-mysql:
    driver: local
  app-mysql-testing:
    driver: local
  app-redis:
    driver: local
  app-redis-testing:
    driver: local
`;
      } else if (answers.database === 'postgres') {
        dockerComposeContent = `services:
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
      - app-net
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
      start_period: 5s
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
      timeout: 5s
networks:
  app-net:
    driver: bridge
volumes:
  app-postgres:
    driver: local
  app-postgres-testing:
    driver: local
  app-redis:
    driver: local
  app-redis-testing:
    driver: local
`;
      } else {
        // mongodb
        dockerComposeContent = `services:
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
      - app-net
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
      start_period: 5s
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
      timeout: 5s
networks:
  app-net:
    driver: bridge
volumes:
  app-mongo:
    driver: local
  app-mongo-testing:
    driver: local
  app-redis:
    driver: local
  app-redis-testing:
    driver: local
`;
      }

      fs.writeFileSync(
        path.join(projectPath, 'docker-compose.yml'),
        dockerComposeContent,
      );
    }

    spinner.succeed('Project structure created!');

    // Initialize Git repository
    spinner.start('Initializing Git repository...');
    try {
      process.chdir(projectPath);

      // Initialize git
      execSync('git init', { stdio: 'ignore' });

      // Stage all files
      execSync('git add .', { stdio: 'ignore' });

      spinner.succeed('Git repository initialized with all files staged!');
    } catch (error) {
      spinner.warn('Git initialization skipped (Git may not be installed)');
    }

    // Install dependencies
    if (!options.skipInstall) {
      spinner.start('Installing dependencies...');

      const installCommand =
        answers.packageManager === 'yarn'
          ? 'yarn'
          : answers.packageManager === 'pnpm'
            ? 'pnpm install'
            : 'npm install';

      try {
        // Make sure we're in the project directory
        process.chdir(projectPath);

        // Run installation with proper error handling
        const { stdout, stderr } = await execAsync(installCommand, {
          cwd: projectPath,
          timeout: 300000,
          env: { ...process.env, NODE_ENV: 'development' },
        });

        // Check if there were any critical errors
        if (stderr && stderr.includes('ERR!')) {
          throw new Error(stderr);
        }

        spinner.succeed('Dependencies installed successfully!');
      } catch (error: any) {
        spinner.fail('Failed to install dependencies');
        console.error(chalk.red('\n❌ Installation error:'));
        console.error(chalk.gray(error.message));

        // Provide clear instructions for manual installation
        console.log(
          chalk.yellow('\n⚠️  Project created but dependencies not installed.'),
        );
        console.log(chalk.cyan('\nTo install dependencies manually:'));
        console.log(chalk.white(`  1. cd ${projectName}`));
        console.log(chalk.white(`  2. ${installCommand}`));
        console.log(
          chalk.white(`  3. ${answers.packageManager} run start:dev\n`),
        );

        // Exit with error code to indicate partial success
        process.exit(1);
      }
    } else {
      // When skipping install, remind user to install deps
      console.log(
        chalk.yellow(
          '\n⚠️  Dependencies not installed (--skip-install flag used)',
        ),
      );
    }

    // Success message - only show if we get here without errors
    console.log(chalk.green('\n✅ Project created successfully!\n'));

    console.log(chalk.cyan('Next steps:'));

    // Only show cd command if we're not already in the directory
    if (process.cwd() !== projectPath) {
      console.log(chalk.white(`  1. cd ${projectName}`));
    }

    if (options.skipInstall) {
      const installCmd =
        answers.packageManager === 'yarn'
          ? 'yarn'
          : answers.packageManager === 'pnpm'
            ? 'pnpm install'
            : 'npm install';
      console.log(chalk.white(`  2. ${installCmd}`));

      if (answers.useDocker) {
        console.log(chalk.white(`  3. docker-compose up`));
        console.log(chalk.gray(`     or`));
        console.log(
          chalk.white(`     ${answers.packageManager} run start:dev`),
        );
      } else {
        console.log(
          chalk.white(`  3. ${answers.packageManager} run start:dev`),
        );
      }
    } else {
      // Dependencies already installed, so just show how to start
      const stepNum = process.cwd() !== projectPath ? '2' : '1';
      if (answers.useDocker) {
        console.log(chalk.white(`  ${stepNum}. docker-compose up`));
        console.log(chalk.gray(`     or`));
        console.log(
          chalk.white(`     ${answers.packageManager} run start:dev`),
        );
      } else {
        console.log(
          chalk.white(`  ${stepNum}. ${answers.packageManager} run start:dev`),
        );
      }
    }

    if (answers.useSwagger) {
      console.log(
        chalk.cyan('\n📚 Swagger documentation will be available at:'),
      );
      console.log(chalk.white('   http://localhost:3000/api'));
    }

    if (answers.useGitHubActions) {
      console.log(chalk.cyan('\n🚀 GitHub Actions workflows added:'));
      console.log(
        chalk.white('   - .github/workflows/tests.yml (automated testing)'),
      );
    }

    console.log(chalk.cyan('\n🎉 Happy coding!'));

    // Coffee support
    console.log(chalk.yellow('\n☕ Enjoying nestForge? Buy me a coffee:'));
    console.log(
      chalk.blue.underline('   https://buymeacoffee.com/mugabodannf\n'),
    );
  } catch (error) {
    spinner.fail('Failed to create project');
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}
