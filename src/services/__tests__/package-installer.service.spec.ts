import { PackageManager } from '../../constants/enums';

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
  let mockChdir: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSpinner = {
      start: jest.fn().mockReturnThis(),
      succeed: jest.fn().mockReturnThis(),
      fail: jest.fn().mockReturnThis(),
      warn: jest.fn().mockReturnThis(),
    };

    (ora as jest.Mock).mockReturnValue(mockSpinner);

    mockChdir = jest.spyOn(process, 'chdir').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    mockChdir.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('getInstallCommand', () => {
    it('should return yarn command for YARN package manager', () => {
      const command = PackageInstallerService.getInstallCommand(
        PackageManager.YARN,
      );

      expect(command).toBe('yarn');
    });

    it('should return pnpm install command for PNPM package manager', () => {
      const command = PackageInstallerService.getInstallCommand(
        PackageManager.PNPM,
      );

      expect(command).toBe('pnpm install');
    });

    it('should return npm install command for NPM package manager', () => {
      const command = PackageInstallerService.getInstallCommand(
        PackageManager.NPM,
      );

      expect(command).toBe('npm install');
    });

    it('should return npm install as default for unknown package manager', () => {
      const command = PackageInstallerService.getInstallCommand(
        'unknown' as PackageManager,
      );

      expect(command).toBe('npm install');
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

    it('should change to project directory', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      await PackageInstallerService.install(projectPath, PackageManager.NPM);

      expect(process.chdir).toHaveBeenCalledWith(projectPath);
    });

    it('should execute npm install command with correct options', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      await PackageInstallerService.install(projectPath, PackageManager.NPM);

      expect(mockExecAsync).toHaveBeenCalledWith('npm install', {
        cwd: projectPath,
        timeout: 300000,
        env: { ...process.env, NODE_ENV: 'development' },
      });
    });

    it('should execute yarn command for YARN package manager', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      await PackageInstallerService.install(projectPath, PackageManager.YARN);

      expect(mockExecAsync).toHaveBeenCalledWith('yarn', {
        cwd: projectPath,
        timeout: 300000,
        env: { ...process.env, NODE_ENV: 'development' },
      });
    });

    it('should execute pnpm install command for PNPM package manager', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      await PackageInstallerService.install(projectPath, PackageManager.PNPM);

      expect(mockExecAsync).toHaveBeenCalledWith('pnpm install', {
        cwd: projectPath,
        timeout: 300000,
        env: { ...process.env, NODE_ENV: 'development' },
      });
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

    it('should throw error when stderr contains ERR!', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: '',
        stderr: 'npm ERR! something went wrong',
      });

      await expect(
        PackageInstallerService.install(projectPath, PackageManager.NPM),
      ).rejects.toThrow('npm ERR! something went wrong');

      expect(mockSpinner.fail).toHaveBeenCalledWith(
        'Failed to install dependencies',
      );
    });

    it('should fail spinner and display error message on installation failure', async () => {
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
        chalk.yellow('\n⚠️  Project created but dependencies not installed.'),
      );
      expect(console.log).toHaveBeenCalledWith(
        chalk.cyan('\nTo install dependencies manually:'),
      );
      expect(console.log).toHaveBeenCalledWith(
        chalk.white(`  1. cd ${projectPath}`),
      );
      expect(console.log).toHaveBeenCalledWith(chalk.white(`  2. npm install`));
      expect(console.log).toHaveBeenCalledWith(
        chalk.white(`  3. npm run start:dev\n`),
      );
    });

    it('should display correct manual instructions for yarn', async () => {
      const error = new Error('Installation failed');
      mockExecAsync.mockRejectedValue(error);

      try {
        await PackageInstallerService.install(projectPath, PackageManager.YARN);
      } catch (e) {
        // Expected to throw
      }

      expect(console.log).toHaveBeenCalledWith(chalk.white(`  2. yarn`));
      expect(console.log).toHaveBeenCalledWith(
        chalk.white(`  3. yarn run start:dev\n`),
      );
    });

    it('should display correct manual instructions for pnpm', async () => {
      const error = new Error('Installation failed');
      mockExecAsync.mockRejectedValue(error);

      try {
        await PackageInstallerService.install(projectPath, PackageManager.PNPM);
      } catch (e) {
        // Expected to throw
      }

      expect(console.log).toHaveBeenCalledWith(
        chalk.white(`  2. pnpm install`),
      );
      expect(console.log).toHaveBeenCalledWith(
        chalk.white(`  3. pnpm run start:dev\n`),
      );
    });

    it('should use correct timeout for installation', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      await PackageInstallerService.install(projectPath, PackageManager.NPM);

      const callArgs = mockExecAsync.mock.calls[0][1];
      expect(callArgs.timeout).toBe(300000);
    });

    it('should set NODE_ENV to development', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      await PackageInstallerService.install(projectPath, PackageManager.NPM);

      const callArgs = mockExecAsync.mock.calls[0][1];
      expect(callArgs.env.NODE_ENV).toBe('development');
    });

    it('should rethrow error after displaying instructions', async () => {
      const error = new Error('Installation failed');
      mockExecAsync.mockRejectedValue(error);

      await expect(
        PackageInstallerService.install(projectPath, PackageManager.NPM),
      ).rejects.toThrow(error);
    });
  });
});
