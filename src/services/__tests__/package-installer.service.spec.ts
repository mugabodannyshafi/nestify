import { Database, PackageManager, ORM } from '../../constants/enums';

jest.mock('child_process');
jest.mock('ora');
jest.mock('chalk');

const mockExecAsync = jest.fn();

jest.mock('util', () => ({
  promisify: jest.fn(() => mockExecAsync),
}));

import { PackageInstallerService } from '../package-installer.service';
import ora from 'ora';
import chalk from 'chalk';

describe('PackageInstallerService', () => {
  let mockSpinner: any;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockExecAsync.mockClear();
    mockExecAsync.mockReset();

    mockSpinner = {
      start: jest.fn().mockReturnThis(),
      succeed: jest.fn().mockReturnThis(),
      fail: jest.fn().mockReturnThis(),
      warn: jest.fn().mockReturnThis(),
    };

    (ora as jest.Mock).mockReturnValue(mockSpinner);

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('getDependencies', () => {
    it('should include base dependencies', () => {
      const deps = PackageInstallerService.getDependencies();

      expect(deps).toContain('@nestjs/swagger');
      expect(deps).toContain('@nestjs/common');
      expect(deps).toContain('@nestjs/core');
      expect(deps).toHaveLength(7);
    });

    it('should include TypeORM dependencies for MySQL', () => {
      const deps = PackageInstallerService.getDependencies(
        Database.MYSQL,
        ORM.TYPEORM,
      );

      expect(deps).toContain('@nestjs/typeorm');
      expect(deps).toContain('typeorm');
      expect(deps).toContain('mysql2');
    });

    it('should include TypeORM dependencies for PostgreSQL', () => {
      const deps = PackageInstallerService.getDependencies(
        Database.POSTGRES,
        ORM.TYPEORM,
      );

      expect(deps).toContain('@nestjs/typeorm');
      expect(deps).toContain('typeorm');
      expect(deps).toContain('pg');
    });

    it('should include Prisma dependencies for MySQL with Prisma ORM', () => {
      const deps = PackageInstallerService.getDependencies(
        Database.MYSQL,
        ORM.PRISMA,
      );

      expect(deps).toContain('@prisma/client');
      expect(deps).not.toContain('@nestjs/typeorm');
      expect(deps).not.toContain('mysql2');
    });

    it('should include Prisma dependencies for PostgreSQL with Prisma ORM', () => {
      const deps = PackageInstallerService.getDependencies(
        Database.POSTGRES,
        ORM.PRISMA,
      );

      expect(deps).toContain('@prisma/client');
      expect(deps).not.toContain('@nestjs/typeorm');
      expect(deps).not.toContain('pg');
    });

    it('should include Mongoose dependencies for MongoDB', () => {
      const deps = PackageInstallerService.getDependencies(Database.MONGODB);

      expect(deps).toContain('@nestjs/mongoose');
      expect(deps).toContain('mongoose');
    });
  });

  describe('getDevDependencies', () => {
    it('should return all dev dependencies', () => {
      const devDeps = PackageInstallerService.getDevDependencies();

      expect(devDeps).toContain('@nestjs/cli');
      expect(devDeps).toContain('@nestjs/testing');
      expect(devDeps).toContain('typescript');
      expect(devDeps).toContain('jest');
      expect(devDeps).toHaveLength(23);
    });

    it('should include Prisma in dev dependencies when using Prisma ORM', () => {
      const devDeps = PackageInstallerService.getDevDependencies(ORM.PRISMA);

      expect(devDeps).toContain('prisma');
      expect(devDeps).toHaveLength(24);
    });
  });

  describe('getInstallCommand', () => {
    it('should return base install command when no packages provided', () => {
      const command = PackageInstallerService.getInstallCommand(
        PackageManager.NPM,
      );

      expect(command).toBe('npm install');
    });

    it('should return base install command when empty packages array provided', () => {
      const command = PackageInstallerService.getInstallCommand(
        PackageManager.NPM,
        [],
      );

      expect(command).toBe('npm install');
    });

    it('should return npm install command with packages', () => {
      const command = PackageInstallerService.getInstallCommand(
        PackageManager.NPM,
        ['package1', 'package2'],
        false,
      );

      expect(command).toBe('npm install  package1 package2');
    });

    it('should return npm install command with dev flag', () => {
      const command = PackageInstallerService.getInstallCommand(
        PackageManager.NPM,
        ['package1', 'package2'],
        true,
      );

      expect(command).toBe('npm install --save-dev package1 package2');
    });

    it('should return yarn add command for YARN package manager', () => {
      const command = PackageInstallerService.getInstallCommand(
        PackageManager.YARN,
        ['package1', 'package2'],
        false,
      );

      expect(command).toBe('yarn add  package1 package2');
    });

    it('should return yarn add with dev flag', () => {
      const command = PackageInstallerService.getInstallCommand(
        PackageManager.YARN,
        ['package1'],
        true,
      );

      expect(command).toBe('yarn add -D package1');
    });

    it('should return pnpm add command for PNPM package manager', () => {
      const command = PackageInstallerService.getInstallCommand(
        PackageManager.PNPM,
        ['package1', 'package2'],
        false,
      );

      expect(command).toBe('pnpm add  package1 package2');
    });

    it('should return pnpm add with dev flag', () => {
      const command = PackageInstallerService.getInstallCommand(
        PackageManager.PNPM,
        ['package1'],
        true,
      );

      expect(command).toBe('pnpm add -D package1');
    });
  });

  describe('install', () => {
    const projectPath = '/test/project/path';

    it('should start spinner with correct message', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      await PackageInstallerService.install(projectPath, PackageManager.NPM);

      expect(ora).toHaveBeenCalledWith('Installing dependencies...');
      expect(mockSpinner.start).toHaveBeenCalled();
    });

    it('should install dependencies and dev dependencies separately', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      await PackageInstallerService.install(
        projectPath,
        PackageManager.NPM,
        Database.POSTGRES,
      );

      expect(mockExecAsync).toHaveBeenCalledTimes(2);

      // Check first call for regular dependencies
      const firstCall = mockExecAsync.mock.calls[0];
      expect(firstCall[0]).toContain('npm install');
      expect(firstCall[0]).toContain('@nestjs/common');
      expect(firstCall[0]).toContain('@nestjs/swagger');

      // Check second call for dev dependencies
      const secondCall = mockExecAsync.mock.calls[1];
      expect(secondCall[0]).toContain('npm install --save-dev');
      expect(secondCall[0]).toContain('@nestjs/cli');
      expect(secondCall[0]).toContain('typescript');
    });

    it('should execute with correct options for both calls', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      await PackageInstallerService.install(projectPath, PackageManager.NPM);

      expect(mockExecAsync).toHaveBeenCalledTimes(2);

      mockExecAsync.mock.calls.forEach((call) => {
        expect(call[1]).toEqual({
          cwd: projectPath,
          timeout: 300000,
          env: { ...process.env, NODE_ENV: 'development' },
        });
      });
    });

    it('should use yarn commands for YARN package manager', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      await PackageInstallerService.install(projectPath, PackageManager.YARN);

      const firstCall = mockExecAsync.mock.calls[0];
      expect(firstCall[0]).toContain('yarn add');
      expect(firstCall[0]).not.toContain('-D');

      const secondCall = mockExecAsync.mock.calls[1];
      expect(secondCall[0]).toContain('yarn add -D');
    });

    it('should use pnpm commands for PNPM package manager', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      await PackageInstallerService.install(projectPath, PackageManager.PNPM);

      const firstCall = mockExecAsync.mock.calls[0];
      expect(firstCall[0]).toContain('pnpm add');
      expect(firstCall[0]).not.toContain('-D');

      const secondCall = mockExecAsync.mock.calls[1];
      expect(secondCall[0]).toContain('pnpm add -D');
    });

    it('should show success message when installation succeeds', async () => {
      mockExecAsync.mockResolvedValue({ stdout: 'success', stderr: '' });

      await PackageInstallerService.install(projectPath, PackageManager.NPM);

      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        'Dependencies installed successfully!',
      );
    });

    it('should handle warnings in stderr without throwing', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: '',
        stderr: 'WARN deprecated package',
      });

      await PackageInstallerService.install(projectPath, PackageManager.NPM);

      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        'Dependencies installed successfully!',
      );
    });

    it('should throw error when stderr contains ERR! in dependencies', async () => {
      mockExecAsync
        .mockResolvedValueOnce({
          stdout: '',
          stderr: 'npm ERR! something went wrong',
        })
        .mockResolvedValueOnce({ stdout: '', stderr: '' });

      await expect(
        PackageInstallerService.install(projectPath, PackageManager.NPM),
      ).rejects.toThrow('npm ERR! something went wrong');

      expect(mockSpinner.fail).toHaveBeenCalledWith(
        'Failed to install dependencies',
      );
    });

    it('should throw error when stderr contains ERR! in dev dependencies', async () => {
      mockExecAsync.mockClear();
      mockExecAsync
        .mockResolvedValueOnce({ stdout: '', stderr: '' })
        .mockResolvedValueOnce({
          stdout: '',
          stderr: 'npm ERR! dev dependency error',
        });

      await expect(
        PackageInstallerService.install(projectPath, PackageManager.NPM),
      ).rejects.toThrow('npm ERR! dev dependency error');

      expect(mockSpinner.fail).toHaveBeenCalledWith(
        'Failed to install dependencies',
      );
    });

    it('should fail spinner and display error message on installation failure', async () => {
      mockExecAsync.mockClear();
      const error = new Error('Installation failed');
      mockExecAsync.mockRejectedValue(error);

      await expect(
        PackageInstallerService.install(projectPath, PackageManager.NPM),
      ).rejects.toThrow('Installation failed');

      expect(mockSpinner.fail).toHaveBeenCalledWith(
        'Failed to install dependencies',
      );
    });

    it('should display error details in red when installation fails', async () => {
      const error = new Error('Network error');
      mockExecAsync.mockRejectedValue(error);

      try {
        await PackageInstallerService.install(projectPath, PackageManager.NPM);
      } catch (e) {
        // Expected to throw
      }

      expect(console.error).toHaveBeenCalledWith(
        chalk.red('\n❌ Installation error:'),
      );
      expect(console.error).toHaveBeenCalledWith(chalk.gray('Network error'));
    });

    it('should display manual installation instructions on failure', async () => {
      const error = new Error('Installation failed');
      mockExecAsync.mockRejectedValue(error);

      try {
        await PackageInstallerService.install(projectPath, PackageManager.NPM);
      } catch (e) {
        // Expected to throw
      }

      expect(console.log).toHaveBeenCalledWith(
        chalk.yellow(
          '\n⚠️  Project created but some dependencies not installed.',
        ),
      );
      expect(console.log).toHaveBeenCalledWith(
        chalk.cyan('\nTo install dependencies manually:'),
      );
      expect(console.log).toHaveBeenCalledWith(
        chalk.white(`  1. cd ${projectPath}`),
      );
      expect(console.log).toHaveBeenCalledWith(chalk.white(`  2. npm install`));
    });

    it('should rethrow error after displaying instructions', async () => {
      const error = new Error('Installation failed');
      mockExecAsync.mockRejectedValue(error);

      await expect(
        PackageInstallerService.install(projectPath, PackageManager.NPM),
      ).rejects.toThrow(error);
    });
  });

  describe('installFromPackageJson', () => {
    const projectPath = '/test/project/path';

    it('should start spinner with correct message', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      await PackageInstallerService.installFromPackageJson(
        projectPath,
        PackageManager.NPM,
      );

      expect(ora).toHaveBeenCalledWith('Installing dependencies...');
      expect(mockSpinner.start).toHaveBeenCalled();
    });

    it('should execute base install command', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      await PackageInstallerService.installFromPackageJson(
        projectPath,
        PackageManager.NPM,
      );

      expect(mockExecAsync).toHaveBeenCalledWith('npm install', {
        cwd: projectPath,
        timeout: 300000,
        env: { ...process.env, NODE_ENV: 'development' },
      });
    });

    it('should use yarn for YARN package manager', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      await PackageInstallerService.installFromPackageJson(
        projectPath,
        PackageManager.YARN,
      );

      expect(mockExecAsync).toHaveBeenCalledWith('yarn', {
        cwd: projectPath,
        timeout: 300000,
        env: { ...process.env, NODE_ENV: 'development' },
      });
    });

    it('should use pnpm install for PNPM package manager', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      await PackageInstallerService.installFromPackageJson(
        projectPath,
        PackageManager.PNPM,
      );

      expect(mockExecAsync).toHaveBeenCalledWith('pnpm install', {
        cwd: projectPath,
        timeout: 300000,
        env: { ...process.env, NODE_ENV: 'development' },
      });
    });

    it('should show success message when installation succeeds', async () => {
      mockExecAsync.mockResolvedValue({ stdout: 'success', stderr: '' });

      await PackageInstallerService.installFromPackageJson(
        projectPath,
        PackageManager.NPM,
      );

      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        'Dependencies installed successfully!',
      );
    });

    it('should handle warnings in stderr without throwing', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: '',
        stderr: 'WARN deprecated package',
      });

      await PackageInstallerService.installFromPackageJson(
        projectPath,
        PackageManager.NPM,
      );

      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        'Dependencies installed successfully!',
      );
    });

    it('should throw error when stderr contains ERR!', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: '',
        stderr: 'npm ERR! something went wrong',
      });

      await expect(
        PackageInstallerService.installFromPackageJson(
          projectPath,
          PackageManager.NPM,
        ),
      ).rejects.toThrow('npm ERR! something went wrong');

      expect(mockSpinner.fail).toHaveBeenCalledWith(
        'Failed to install dependencies',
      );
    });

    it('should display manual installation instructions including start command', async () => {
      const error = new Error('Installation failed');
      mockExecAsync.mockRejectedValue(error);

      try {
        await PackageInstallerService.installFromPackageJson(
          projectPath,
          PackageManager.NPM,
        );
      } catch (e) {
        // Expected to throw
      }

      expect(console.log).toHaveBeenCalledWith(
        chalk.yellow('\n⚠️  Project created but dependencies not installed.'),
      );
      expect(console.log).toHaveBeenCalledWith(
        chalk.white(`  3. npm run start:dev\n`),
      );
    });

    it('should display correct start command for yarn', async () => {
      const error = new Error('Installation failed');
      mockExecAsync.mockRejectedValue(error);

      try {
        await PackageInstallerService.installFromPackageJson(
          projectPath,
          PackageManager.YARN,
        );
      } catch (e) {
        // Expected to throw
      }

      expect(console.log).toHaveBeenCalledWith(
        chalk.white(`  3. yarn start:dev\n`),
      );
    });

    it('should display correct start command for pnpm', async () => {
      const error = new Error('Installation failed');
      mockExecAsync.mockRejectedValue(error);

      try {
        await PackageInstallerService.installFromPackageJson(
          projectPath,
          PackageManager.PNPM,
        );
      } catch (e) {
        // Expected to throw
      }

      expect(console.log).toHaveBeenCalledWith(
        chalk.white(`  3. pnpm run start:dev\n`),
      );
    });
  });
});
