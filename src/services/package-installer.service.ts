import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import ora from 'ora';
import { PackageManager } from '../constants/enums';

const execAsync = promisify(exec);

export class PackageInstallerService {
  static getInstallCommand(packageManager: PackageManager): string {
    switch (packageManager) {
      case PackageManager.YARN:
        return 'yarn';
      case PackageManager.PNPM:
        return 'pnpm install';
      default:
        return 'npm install';
    }
  }

  static async install(
    projectPath: string,
    packageManager: PackageManager,
  ): Promise<void> {
    const spinner = ora('Installing dependencies...');
    spinner.start();

    const installCommand = this.getInstallCommand(packageManager);

    try {
      process.chdir(projectPath);

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
      console.log(chalk.white(`  3. ${packageManager} run start:dev\n`));

      throw error;
    }
  }
}
