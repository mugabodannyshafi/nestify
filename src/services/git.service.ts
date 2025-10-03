import { execSync } from 'child_process';
import ora from 'ora';

export class GitService {
  static initialize(projectPath: string): void {
    const spinner = ora('Initializing Git repository...');
    spinner.start();

    try {
      process.chdir(projectPath);
      execSync('git init', { stdio: 'ignore' });
      execSync('git add .', { stdio: 'ignore' });
      spinner.succeed('Git repository initialized with all files staged!');
    } catch {
      spinner.warn('Git initialization skipped (Git may not be installed)');
    }
  }
}
