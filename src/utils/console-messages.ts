import chalk from 'chalk';
import { ProjectConfig } from '../types/project.types';
import { PackageInstallerService } from '../services/package-installer.service';

export class ConsoleMessages {
  static showSuccess(
    config: ProjectConfig,
    skipInstall: boolean,
    needsCd: boolean,
  ): void {
    console.log(chalk.green('\n✅ Project created successfully!\n'));
    console.log(chalk.cyan('Next steps:'));

    let stepNumber = 1;

    // CD command if needed
    if (needsCd) {
      console.log(chalk.white(`  ${stepNumber}. cd ${config.name}`));
      stepNumber++;
    }

    // Install command if skipped
    if (skipInstall) {
      const installCmd = PackageInstallerService.getInstallCommand(
        config.answers.packageManager,
      );
      console.log(chalk.white(`  ${stepNumber}. ${installCmd}`));
      stepNumber++;
    }

    // Start command
    this.showStartCommand(config, stepNumber);

    // Additional features info
    if (config.answers.useSwagger) {
      console.log(
        chalk.cyan('\n📚 Swagger documentation will be available at:'),
      );
      console.log(chalk.white('   http://localhost:3000/api'));
    }

    if (config.answers.useGitHubActions) {
      console.log(chalk.cyan('\n🚀 GitHub Actions workflows added:'));
      console.log(
        chalk.white('   - .github/workflows/tests.yml (automated testing)'),
      );
    }

    console.log(chalk.cyan('\n🎉 Happy coding!'));
    console.log(chalk.yellow('\n☕ Enjoying nestify? Buy me a coffee:'));
    console.log(
      chalk.blue.underline('   https://buymeacoffee.com/mugabodannf\n'),
    );
  }

  private static showStartCommand(
    config: ProjectConfig,
    stepNumber: number,
  ): void {
    if (config.answers.useDocker) {
      console.log(chalk.white(`  ${stepNumber}. docker-compose up`));
      console.log(chalk.gray(`     or`));
      console.log(
        chalk.white(`     ${config.answers.packageManager} run start:dev`),
      );
    } else {
      console.log(
        chalk.white(
          `  ${stepNumber}. ${config.answers.packageManager} run start:dev`,
        ),
      );
    }
  }
}
