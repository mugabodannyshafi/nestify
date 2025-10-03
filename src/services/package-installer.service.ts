import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import ora from 'ora';
import { PackageManager } from '../constants/enums';

const execAsync = promisify(exec);

export class PackageInstallerService {
  static getDependencies(useSwagger: boolean): string[] {
    const dependencies = [
      '@nestjs/common',
      '@nestjs/core',
      '@nestjs/platform-express',
      'reflect-metadata',
      'rxjs',
    ];

    if (useSwagger) {
      dependencies.push('@nestjs/swagger');
    }

    return dependencies;
  }

  static getDevDependencies(): string[] {
    return [
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
    useSwagger: boolean = true,
  ): Promise<void> {
    const spinner = ora('Installing dependencies...').start();

    try {
      const dependencies = this.getDependencies(useSwagger);
      const devDependencies = this.getDevDependencies();

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
}
