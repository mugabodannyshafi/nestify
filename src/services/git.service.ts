import { execSync } from 'child_process';
import ora from 'ora';

export class GitService {
  static ensureGitInstalled(): void {
    try {
      execSync('git --version', { stdio: 'ignore' });
    } catch (error) {
      throw new Error('Git is not installed');
    }
  }
  static initialize(projectPath: string): void {
    const spinner = ora('Initializing Git repository...');
    spinner.start();

    try {
      process.chdir(projectPath);
      execSync('git init', { stdio: 'ignore' });
      execSync('git add .', { stdio: 'ignore' });
      spinner.succeed('Git repository initialized with all files staged!');
    } catch (error) {
      spinner.fail('Git initialization failed');
      // Provide actionable guidance
      console.error(
        '\nGit initialization failed:',
        (error && (error as Error).message) || error,
      );
      console.error(
        'You can retry initializing a Git repository manually by running:\n  cd',
        projectPath,
      );
      console.error('  git init');
      console.error('  git add .');
      console.error('  git commit -m "chore: initial commit"\n');
    }
  }
}
