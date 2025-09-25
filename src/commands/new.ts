import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';
import { NewCommandOptions, ProjectConfig } from '../types/project.types';
import { PromptsService } from '../services/prompts.service';
import { FileGeneratorService } from '../services/file-generator.service';
import { GitService } from '../services/git.service';
import { PackageInstallerService } from '../services/package-installer.service';
import { createProjectStructure } from '../utils/project-structure';
import { ConsoleMessages } from '../utils/console-messages';

export async function newCommand(
  projectName: string,
  options: NewCommandOptions,
) {
  const spinner = ora();

  try {
    // Validate project directory
    const projectPath = path.resolve(process.cwd(), projectName);
    if (fs.existsSync(projectPath)) {
      console.log(chalk.red(`❌ Directory ${projectName} already exists!`));
      process.exit(1);
    }

    // Get project configuration from user
    const answers = await PromptsService.getProjectDetails(
      options.packageManager,
    );

    const config: ProjectConfig = {
      name: projectName,
      path: projectPath,
      answers,
    };

    console.log(chalk.green(`\n📁 Creating project: ${projectName}\n`));

    // Create project structure
    spinner.start('Creating project structure...');
    fs.ensureDirSync(projectPath);
    createProjectStructure(projectPath);

    // Generate all project files
    FileGeneratorService.generateBaseFiles(config);
    FileGeneratorService.generateSourceFiles(config);
    FileGeneratorService.generateTestFiles(config);
    FileGeneratorService.generateEnvironmentFiles(config);
    FileGeneratorService.generateConfigFiles(config);
    FileGeneratorService.generateDockerFiles(config);
    FileGeneratorService.generateGraphQLFiles(config);
    FileGeneratorService.generateGitHubActionsFiles(config);
    FileGeneratorService.generateReadme(config);

    spinner.succeed('Project structure created!');

    // Initialize Git
    GitService.initialize(projectPath);

    // Install dependencies
    if (!options.skipInstall) {
      await PackageInstallerService.install(
        projectPath,
        answers.packageManager,
      );
    } else {
      console.log(
        chalk.yellow(
          '\n⚠️  Dependencies not installed (--skip-install flag used)',
        ),
      );
    }

    // Show success message and next steps
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
