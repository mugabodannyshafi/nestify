import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import ora from 'ora';
import { PackageManager, Database, ORM } from '../constants/enums';

const execAsync = promisify(exec);

export class PackageInstallerService {
  static getDependencies(database?: Database, orm?: ORM): string[] {
    const dependencies = [
      '@nestjs/common',
      '@nestjs/core',
      '@nestjs/platform-express',
      '@nestjs/config',
      '@nestjs/swagger',
      'reflect-metadata',
      'rxjs',
    ];

    // Add database-specific dependencies
    if (database === Database.MYSQL || database === Database.POSTGRES) {
      if (orm === ORM.PRISMA) {
        // Prisma dependencies
        dependencies.push('@prisma/client');
      } else {
        // TypeORM dependencies (default)
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

    return dependencies;
  }

  static getDevDependencies(orm?: ORM): string[] {
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

    // Add Prisma as dev dependency if using Prisma
    if (orm === ORM.PRISMA) {
      devDeps.push('prisma');
    }

    return devDeps;
  }

  static getInstallCommand(
    packageManager: PackageManager,
    packages?: string[],
    isDev: boolean = false,
  ): string {
    // If no packages provided, return base install command
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
  ): Promise<void> {
    const spinner = ora('Installing dependencies...').start();

    try {
      const dependencies = this.getDependencies(database, orm);
      const devDependencies = this.getDevDependencies(orm);

      // Install regular dependencies
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

      // If using Prisma, run prisma generate
      if (orm === ORM.PRISMA) {
        spinner.text = 'Generating Prisma Client...';
        const prismaCommand = this.getPrismaGenerateCommand(packageManager);
        await execAsync(prismaCommand, {
          cwd: projectPath,
          timeout: 60000,
        });
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
