import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';
import { execSync } from 'child_process';
import inquirer from 'inquirer';
import { createProjectStructure } from '../utils/project-structure';
import { createPackageJson } from '../templates/package-json.template';
import { createTsConfig } from '../templates/tsconfig.template';
import { createMainTs } from '../templates/main.template';
import { createAppModule } from '../templates/app-module.template';
import { createAppController } from '../templates/app-controller.template';
import { createAppService } from '../templates/app-service.template';

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
`;
    fs.writeFileSync(path.join(projectPath, '.env'), envContent);
    fs.writeFileSync(path.join(projectPath, '.env.example'), envContent);

    // Create .gitignore
    const gitignoreContent = `# Dependencies
node_modules/
dist/

# Environment
.env

# IDE
.vscode/
.idea/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
Thumbs.db
`;
    fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignoreContent);

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

    // Install dependencies
    if (!options.skipInstall) {
      spinner.start('Installing dependencies...');
      process.chdir(projectPath);

      const installCommand =
        options.packageManager === 'yarn'
          ? 'yarn'
          : options.packageManager === 'pnpm'
            ? 'pnpm install'
            : 'npm install';

      execSync(installCommand, { stdio: 'pipe' });
      spinner.succeed('Dependencies installed!');
    }

    // Success message
    console.log(chalk.green('\n✅ Project created successfully!\n'));
    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.white(`  1. cd ${projectName}`));
    if (options.skipInstall) {
      console.log(chalk.white(`  2. npm install`));
      console.log(chalk.white(`  3. npm run start:dev`));
    } else {
      console.log(chalk.white(`  2. npm run start:dev`));
    }
    console.log(chalk.cyan('\nHappy coding! 🚀\n'));
  } catch (error) {
    spinner.fail('Failed to create project');
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}
