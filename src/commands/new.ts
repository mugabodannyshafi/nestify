import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';
import { NewCommandOptions, ProjectConfig } from '../types/project.types';
import { PromptsService } from '../services/prompts.service';
import { FileGeneratorService } from '../services/file-generator.service';
import { GitService } from '../services/git.service';
import { PackageInstallerService } from '../services/package-installer.service';
import { FormatterService } from '../services/formatter.service';
import { createProjectStructure } from '../utils/project-structure';
import { ConsoleMessages } from '../utils/console-messages';

export async function newCommand(
  projectName: string,
  options: NewCommandOptions,
) {
  const spinner = ora();

  try {
    const projectPath = path.resolve(process.cwd(), projectName);
    if (fs.existsSync(projectPath)) {
      console.log(chalk.red(`❌ Directory ${projectName} already exists!`));
      process.exit(1);
    }

    const answers = await PromptsService.getProjectDetails(
      options.packageManager,
    );

    const config: ProjectConfig = {
      name: projectName,
      path: projectPath,
      answers,
    };

    console.log(chalk.green(`\n📁 Creating project: ${projectName}\n`));

    spinner.start('Creating project structure...');
    fs.ensureDirSync(projectPath);
    createProjectStructure(projectPath, answers.orm);

    FileGeneratorService.generateBaseFiles(config);
    FileGeneratorService.generateSourceFiles(config);
    FileGeneratorService.generateDatabaseFiles(config);
    FileGeneratorService.generateTestFiles(config);
    FileGeneratorService.generateEnvironmentFiles(config);
    FileGeneratorService.generateConfigFiles(config);
    FileGeneratorService.generateDockerFiles(config);
    FileGeneratorService.generateGitHubActionsFiles(config);
    FileGeneratorService.generateReadme(config);

    spinner.succeed('Project structure created!');

    if (!options.skipInstall) {
      await PackageInstallerService.install(
        projectPath,
        answers.packageManager,
        answers.database,
        answers.orm,
        answers.useAuth,
        answers.authStrategies,
      );

      // THEN generate authentication files (after packages are installed)
      if (answers.useAuth && answers.authStrategies) {
        spinner.start('Generating authentication files...');
        FileGeneratorService.generateAuthFiles(config);
        spinner.succeed('Authentication files generated!');
      }

      await FormatterService.format(projectPath, answers.packageManager);
      GitService.initialize(projectPath);
    } else {
      console.log(
        chalk.yellow(
          '\n⚠️  Dependencies not installed (--skip-install flag used)',
        ),
      );

      if (answers.useAuth) {
        console.log(
          chalk.yellow(
            '⚠️  Authentication files not generated (requires dependencies first)',
          ),
        );
        console.log(chalk.cyan('\nTo complete authentication setup:'));
        console.log(chalk.white(`  1. cd ${projectName}`));
        console.log(
          chalk.white(
            `  2. ${PackageInstallerService['getBaseInstallCommand'](answers.packageManager)}`,
          ),
        );
        console.log(chalk.white(`  3. nestify generate auth --strategy jwt`));
      }

      console.log(
        chalk.yellow('⚠️  Code formatting skipped (requires dependencies)'),
      );
      console.log(
        chalk.yellow('⚠️  Git initialization skipped (format first)'),
      );

      GitService.initialize(projectPath);
    }

    ConsoleMessages.showSuccess(
      config,
      options.skipInstall,
      process.cwd() !== projectPath,
    );
  } catch (error) {
    spinner.fail('Failed to create project');
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}
