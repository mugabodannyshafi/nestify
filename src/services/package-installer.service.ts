import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import ora from 'ora';
import { PackageManager, Database, ORM } from '../constants/enums';
import { PrismaService } from './prisma.service';

const execAsync = promisify(exec);

export class PackageInstallerService {
  static getDependencies(
    database?: Database,
    orm?: ORM,
    useAuth?: boolean,
    authStrategies?: string[],
  ): string[] {
    const dependencies = [
      '@nestjs/common',
      '@nestjs/core',
      '@nestjs/platform-express',
      '@nestjs/config',
      '@nestjs/swagger',
      'reflect-metadata',
      'rxjs',
      'class-validator',
      'class-transformer',
    ];

    // Add database-specific dependencies
    if (database === Database.MYSQL || database === Database.POSTGRES) {
      if (orm === ORM.PRISMA) {
        dependencies.push('@prisma/client');
      } else {
        dependencies.push('@nestjs/typeorm', 'typeorm');

        if (database === Database.MYSQL) {
          dependencies.push('mysql2');
        } else if (database === Database.POSTGRES) {
          dependencies.push('pg');
        }
      }
    } else if (database === Database.MONGODB) {
      dependencies.push('@nestjs/mongoose', 'mongoose');
    }

    // Add authentication dependencies
    if (useAuth && authStrategies?.includes('jwt')) {
      dependencies.push(
        '@nestjs/jwt',
        '@nestjs/passport',
        'passport',
        'passport-jwt',
        'passport-local',
        'bcrypt',
      );
    }

    return dependencies;
  }

  static getDevDependencies(
    orm?: ORM,
    useAuth?: boolean,
    authStrategies?: string[],
  ): string[] {
    const devDeps = [
      '@nestjs/cli',
      '@nestjs/schematics',
      '@nestjs/testing',
      '@types/express',
      '@types/jest',
      '@types/node',
      '@types/supertest',
      '@typescript-eslint/eslint-plugin',
      '@typescript-eslint/parser',
      '@eslint/js',
      'eslint',
      'eslint-config-prettier',
      'eslint-plugin-prettier',
      'jest',
      'prettier',
      'source-map-support',
      'supertest',
      'ts-jest',
      'ts-loader',
      'ts-node',
      'tsconfig-paths',
      'typescript',
      'typescript-eslint',
    ];

    if (orm === ORM.PRISMA) {
      devDeps.push('prisma');
    }

    // Add authentication dev dependencies
    if (useAuth && authStrategies?.includes('jwt')) {
      devDeps.push(
        '@types/passport-jwt',
        '@types/passport-local',
        '@types/bcrypt',
      );
    }

    return devDeps;
  }

  static getInstallCommand(
    packageManager: PackageManager,
    packages?: string[],
    isDev: boolean = false,
  ): string {
    if (!packages || packages.length === 0) {
      return this.getBaseInstallCommand(packageManager);
    }

    const pkgList = packages.join(' ');

    switch (packageManager) {
      case PackageManager.YARN:
        return `yarn add ${isDev ? '-D' : ''} ${pkgList}`;
      case PackageManager.PNPM:
        return `pnpm add ${isDev ? '-D' : ''} ${pkgList}`;
      default:
        return `npm install ${isDev ? '--save-dev' : ''} ${pkgList}`;
    }
  }

  static async install(
    projectPath: string,
    packageManager: PackageManager,
    database?: Database,
    orm?: ORM,
    useAuth?: boolean,
    authStrategies?: string[],
  ): Promise<void> {
    const spinner = ora('Installing dependencies...').start();

    try {
      const dependencies = this.getDependencies(
        database,
        orm,
        useAuth,
        authStrategies,
      );
      const devDependencies = this.getDevDependencies(
        orm,
        useAuth,
        authStrategies,
      );

      // Install regular dependencies
      spinner.text = 'Installing dependencies...';
      const depsCommand = this.getInstallCommand(
        packageManager,
        dependencies,
        false,
      );
      const { stderr: depsStderr } = await execAsync(depsCommand, {
        cwd: projectPath,
        timeout: 300000,
        env: { ...process.env, NODE_ENV: 'development' },
      });

      if (depsStderr && depsStderr.includes('ERR!')) {
        throw new Error(depsStderr);
      }

      // Install dev dependencies
      spinner.text = 'Installing dev dependencies...';
      const devDepsCommand = this.getInstallCommand(
        packageManager,
        devDependencies,
        true,
      );
      const { stderr: devStderr } = await execAsync(devDepsCommand, {
        cwd: projectPath,
        timeout: 300000,
        env: { ...process.env, NODE_ENV: 'development' },
      });

      if (devStderr && devStderr.includes('ERR!')) {
        throw new Error(devStderr);
      }

      // If using Prisma, initialize it
      if (orm === ORM.PRISMA && database) {
        spinner.text = 'Initializing Prisma...';

        await PrismaService.initializePrisma(
          projectPath,
          database,
          packageManager,
          useAuth,
        );

        await PrismaService.createPrismaService(projectPath);
        await PrismaService.createPrismaModule(projectPath);
      }

      spinner.succeed('Dependencies installed successfully!');
    } catch (error: any) {
      spinner.fail('Failed to install dependencies');
      console.error(chalk.red('\n❌ Installation error:'));
      console.error(chalk.gray(error.message));

      console.log(
        chalk.yellow(
          '\n⚠️  Project created but some dependencies not installed.',
        ),
      );
      console.log(chalk.cyan('\nTo install dependencies manually:'));
      console.log(chalk.white(`  1. cd ${projectPath}`));
      console.log(
        chalk.white(`  2. ${this.getBaseInstallCommand(packageManager)}`),
      );

      throw error;
    }
  }

  static async installFromPackageJson(
    projectPath: string,
    packageManager: PackageManager,
  ): Promise<void> {
    const spinner = ora('Installing dependencies...').start();

    const installCommand = this.getBaseInstallCommand(packageManager);

    try {
      const { stderr } = await execAsync(installCommand, {
        cwd: projectPath,
        timeout: 300000,
        env: { ...process.env, NODE_ENV: 'development' },
      });

      if (stderr && stderr.includes('ERR!')) {
        throw new Error(stderr);
      }

      spinner.succeed('Dependencies installed successfully!');
    } catch (error: any) {
      spinner.fail('Failed to install dependencies');
      console.error(chalk.red('\n❌ Installation error:'));
      console.error(chalk.gray(error.message));

      console.log(
        chalk.yellow('\n⚠️  Project created but dependencies not installed.'),
      );
      console.log(chalk.cyan('\nTo install dependencies manually:'));
      console.log(chalk.white(`  1. cd ${projectPath}`));
      console.log(chalk.white(`  2. ${installCommand}`));
      console.log(
        chalk.white(`  3. ${this.getStartCommand(packageManager)}\n`),
      );

      throw error;
    }
  }

  private static getBaseInstallCommand(packageManager: PackageManager): string {
    switch (packageManager) {
      case PackageManager.YARN:
        return 'yarn';
      case PackageManager.PNPM:
        return 'pnpm install';
      default:
        return 'npm install';
    }
  }

  private static getStartCommand(packageManager: PackageManager): string {
    switch (packageManager) {
      case PackageManager.YARN:
        return 'yarn start:dev';
      case PackageManager.PNPM:
        return 'pnpm run start:dev';
      default:
        return 'npm run start:dev';
    }
  }

  private static getPrismaGenerateCommand(
    packageManager: PackageManager,
  ): string {
    switch (packageManager) {
      case PackageManager.YARN:
        return 'yarn prisma generate';
      case PackageManager.PNPM:
        return 'pnpm prisma generate';
      default:
        return 'npx prisma generate';
    }
  }
}
