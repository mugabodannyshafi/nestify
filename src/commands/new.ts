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
        type: 'confirm',
        name: 'useSwagger',
        message: 'Add Swagger documentation?',
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
      path.join(projectPath, 'src/app.service.ts'),
      createAppService(),
    );

    // Create .env and .env.example
    const envContent = `# Environment variables
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
    fs.writeFileSync(path.join(projectPath, '.env'), envContent);
    fs.writeFileSync(path.join(projectPath, '.env.example'), envContent);

    // Create .env.testing
    const envTestingContent = `# Testing Environment variables
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
    fs.writeFileSync(path.join(projectPath, '.env.testing'), envTestingContent);
    fs.writeFileSync(
      path.join(projectPath, '.env.testing.example'),
      envTestingContent,
    );

    // Create .gitignore
    const gitignoreContent = `# Dependencies
node_modules/
dist/

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
npm install
\`\`\`

## Running the app

\`\`\`bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
\`\`\`

## Test

\`\`\`bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
\`\`\`

---
Generated with nestForge 🔨
`;
    fs.writeFileSync(path.join(projectPath, 'README.md'), readmeContent);

    // Create Docker files if requested
    if (answers.useDocker) {
      const dockerfileContent = `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["node", "dist/main"]
`;
      fs.writeFileSync(path.join(projectPath, 'Dockerfile'), dockerfileContent);

      const dockerComposeContent = `version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - .:/app
      - /app/node_modules
`;
      fs.writeFileSync(
        path.join(projectPath, 'docker-compose.yml'),
        dockerComposeContent,
      );
    }

    spinner.succeed('Project structure created!');

    // Install dependencies - FIXED: Now uses async execution
    if (!options.skipInstall) {
      spinner.start('Installing dependencies...');
      process.chdir(projectPath);

      const installCommand =
        answers.packageManager === 'yarn'
          ? 'yarn'
          : answers.packageManager === 'pnpm'
            ? 'pnpm install'
            : 'npm install';

      try {
        await execAsync(installCommand, {
          cwd: projectPath,
          // Optional: Set a reasonable timeout (5 minutes)
          timeout: 300000,
        });
        spinner.succeed('Dependencies installed!');
      } catch (error: any) {
        spinner.fail('Failed to install dependencies');
        console.error(chalk.red('Installation error:'), error.message);
        // Don't exit here - project structure is still created
        console.log(
          chalk.yellow('\n⚠️  You can install dependencies manually later:'),
        );
        console.log(
          chalk.white(`    cd ${projectName} && ${installCommand}\n`),
        );
      }
    }

    // Success message
    console.log(chalk.green('\n✅ Project created successfully!\n'));

    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.white(`  1. cd ${projectName}`));

    if (options.skipInstall) {
      const installCmd =
        answers.packageManager === 'yarn'
          ? 'yarn'
          : answers.packageManager === 'pnpm'
            ? 'pnpm install'
            : 'npm install';
      console.log(chalk.white(`  2. ${installCmd}`));
      console.log(chalk.white(`  3. ${answers.packageManager} run start:dev`));
    } else {
      console.log(chalk.white(`  2. ${answers.packageManager} run start:dev`));
    }

    console.log(chalk.cyan('\nHappy coding! 🚀'));

    // Coffee support
    console.log(chalk.yellow('\n☕ Enjoying this tool? Buy me a coffee:'));
    console.log(
      chalk.blue.underline('   https://buymeacoffee.com/mugabodannf\n'),
    );
  } catch (error) {
    spinner.fail('Failed to create project');
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}
