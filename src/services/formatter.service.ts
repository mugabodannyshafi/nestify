import ora from 'ora';
import { execa } from 'execa';

export class FormatterService {
  static async format(
    projectPath: string,
    packageManager: string,
  ): Promise<void> {
    const spinner = ora('Formatting code...').start();

    try {
      // Determine the command based on package manager
      const commands: Record<string, string[]> = {
        npm: ['npm', 'run', 'format'],
        yarn: ['yarn', 'format'],
        pnpm: ['pnpm', 'format'],
      };

      const [cmd, ...args] = commands[packageManager] || commands.npm;

      await execa(cmd, args, {
        cwd: projectPath,
        stdio: 'pipe',
      });

      spinner.succeed('Code formatted successfully!');
    } catch {
      spinner.warn(
        'Code formatting skipped (format script may not be available)',
      );
    }
  }

  static async check(
    projectPath: string,
    packageManager: string,
  ): Promise<boolean> {
    try {
      const commands: Record<string, string[]> = {
        npm: ['npm', 'run', 'format:check'],
        yarn: ['yarn', 'format:check'],
        pnpm: ['pnpm', 'format:check'],
      };

      const [cmd, ...args] = commands[packageManager] || commands.npm;

      await execa(cmd, args, {
        cwd: projectPath,
        stdio: 'pipe',
      });

      return true;
    } catch {
      return false;
    }
  }
}
