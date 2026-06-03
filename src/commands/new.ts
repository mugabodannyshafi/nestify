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
import { ValidationService } from '../services/validation.service';
import { createProjectStructure } from '../utils/project-structure';
import { ConsoleMessages } from '../utils/console-messages';

export async function newCommand(
  projectName: string,
  options: NewCommandOptions,
) {
  const spinner = ora();

  try {
    // Validate project name
    const nameErrors = ValidationService.validateProjectName(projectName);
    if (nameErrors.length > 0) {
      console.error(chalk.red(ValidationService.formatErrors(nameErrors)));
      process.exit(1);
    }

    // Validate package manager
    const pmErrors = ValidationService.validatePackageManager(
      options.packageManager,
    );
    if (pmErrors.length > 0) {
      console.error(chalk.red(ValidationService.formatErrors(pmErrors)));
      process.exit(1);
    }

    const projectPath = path.resolve(process.cwd(), projectName);
    if (fs.existsSync(projectPath)) {
      console.log(chalk.red(`❌ Directory ${projectName} already exists!`));
      process.exit(1);
    }

    // Early validation: ensure Git is installed unless explicitly skipped
    if (!options.noGit) {
      try {
        GitService.ensureGitInstalled();
      } catch (err) {
        console.error(
          chalk.red('\n❌ Git is not installed or not available in PATH.'),
        );
        console.error(
          chalk.white('Please install Git: https://git-scm.com/download'),
        );
        console.error(chalk.white('\nInstallation hints:'));
        console.error(chalk.white('  macOS: brew install git'));
        console.error(
          chalk.white('  Linux (Debian/Ubuntu): sudo apt-get install git'),
        );
        console.error(
          chalk.white('  Windows: https://git-scm.com/download/win'),
        );
        console.error(
          chalk.white(
            '\nIf you intentionally want to skip Git initialization, run with --no-git.',
          ),
        );
        process.exit(1);
      }
    }

    const answers = await PromptsService.getProjectDetails(
      options.packageManager,
    );

    const config: ProjectConfig = {
      name: projectName,
      path: projectPath,
      answers,
    };

    // If --dry-run flag is set, show preview and exit
    if (options.dryRun) {
      showDryRunPreview(config, options.skipInstall);
      process.exit(0);
    }

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
      if (!options.noGit) {
        GitService.initialize(projectPath);
      }
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

      if (!options.noGit) {
        GitService.initialize(projectPath);
      }
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

/**
 * Display a dry-run preview of the project that would be created
 */
function showDryRunPreview(config: ProjectConfig, skipInstall: boolean): void {
  console.log(
    chalk.cyan.bold('\n✨ DRY-RUN MODE (No files will be created)\n'),
  );
  console.log(chalk.cyan('📋 Project Configuration:\n'));

  console.log(chalk.white(`  Project Name:       ${chalk.green(config.name)}`));
  console.log(chalk.white(`  Project Path:       ${chalk.green(config.path)}`));
  console.log(
    chalk.white(
      `  Package Manager:    ${chalk.green(config.answers.packageManager)}`,
    ),
  );
  console.log(
    chalk.white(
      `  Description:        ${chalk.green(config.answers.description)}`,
    ),
  );
  console.log(
    chalk.white(`  Author:             ${chalk.green(config.answers.author)}`),
  );
  console.log(
    chalk.white(
      `  Docker Support:     ${chalk.green(config.answers.useDocker ? 'Yes' : 'No')}`,
    ),
  );

  if (config.answers.database) {
    console.log(
      chalk.white(
        `  Database:           ${chalk.green(config.answers.database)}`,
      ),
    );
  }

  if (config.answers.orm) {
    console.log(
      chalk.white(`  ORM:                ${chalk.green(config.answers.orm)}`),
    );
  }

  console.log(
    chalk.white(
      `  Authentication:     ${chalk.green(config.answers.useAuth ? 'Yes' : 'No')}`,
    ),
  );

  if (
    config.answers.authStrategies &&
    config.answers.authStrategies.length > 0
  ) {
    console.log(
      chalk.white(
        `  Auth Strategies:    ${chalk.green(config.answers.authStrategies.join(', '))}`,
      ),
    );
  }

  console.log(chalk.cyan('\n📦 Files that would be generated:\n'));
  console.log(chalk.gray('  ├── src/'));
  console.log(chalk.gray('  │   ├── main.ts'));
  console.log(chalk.gray('  │   ├── app.module.ts'));
  console.log(chalk.gray('  │   ├── app.controller.ts'));
  console.log(chalk.gray('  │   ├── app.service.ts'));
  console.log(chalk.gray('  │   ├── app.controller.spec.ts'));
  console.log(chalk.gray('  │   ├── app.service.spec.ts'));
  console.log(chalk.gray('  │   └── (database files)'));
  console.log(chalk.gray('  ├── test/'));
  console.log(chalk.gray('  │   └── app.e2e-spec.ts'));
  console.log(chalk.gray('  ├── .env'));
  console.log(chalk.gray('  ├── .env.example'));
  console.log(chalk.gray('  ├── tsconfig.json'));
  console.log(chalk.gray('  ├── jest.config.ts'));
  console.log(chalk.gray('  ├── package.json'));
  console.log(chalk.gray('  ├── docker-compose.yml'));
  console.log(chalk.gray('  ├── .github/workflows/'));
  console.log(chalk.gray('  ├── .gitignore'));
  console.log(chalk.gray('  ├── .prettierrc'));
  console.log(chalk.gray('  ├── .eslintrc.js'));
  console.log(chalk.gray('  └── README.md'));

  console.log(chalk.cyan('\n🔧 Next Steps:\n'));
  console.log(chalk.white('  1. Create project:'));
  console.log(chalk.gray(`     nestify new ${config.name}`));
  console.log(chalk.white('\n  2. Navigate to project:'));
  console.log(chalk.gray(`     cd ${config.name}`));
  console.log(chalk.white('\n  3. Start development:'));
  console.log(chalk.gray(`     npm run start:dev`));

  console.log(
    chalk.yellow(
      `\n⚠️  Dependencies will ${skipInstall ? 'NOT ' : ''}be installed`,
    ),
  );

  console.log(
    chalk.green('\n✅ Ready to create! Remove --dry-run flag to proceed.\n'),
  );
}
