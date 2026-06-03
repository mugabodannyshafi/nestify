import inquirer from 'inquirer';
import { ProjectAnswers } from '../types/project.types';
import { PackageManager, Database, ORM } from '../constants/enums';
import { ValidationService } from './validation.service';

export class PromptsService {
  static async getProjectDetails(
    defaultPackageManager?: string,
  ): Promise<ProjectAnswers> {
    // Validate provided package manager
    if (
      defaultPackageManager &&
      !Object.values(PackageManager).includes(
        defaultPackageManager as PackageManager,
      )
    ) {
      console.warn(
        `⚠️  Invalid package manager: ${defaultPackageManager}. Using default (npm)`,
      );
      defaultPackageManager = PackageManager.NPM;
    }

    const answers: Partial<ProjectAnswers> = await inquirer.prompt([
      {
        type: 'list',
        name: 'packageManager',
        message: 'Which package manager would you like to use?',
        choices: Object.values(PackageManager),
        default: defaultPackageManager || PackageManager.NPM,
      },
      {
        type: 'input',
        name: 'description',
        message: 'Project description:',
        default: 'A NestJS application',
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'Description cannot be empty.';
          }
          if (input.length > 200) {
            return 'Description is too long (max 200 characters).';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'author',
        message: 'Author:',
        default: '',
        validate: (input: string) => {
          if (input && input.length > 100) {
            return 'Author name is too long (max 100 characters).';
          }
          return true;
        },
      },
      {
        type: 'list',
        name: 'database',
        message: 'Which database would you like to use?',
        choices: Object.values(Database),
        default: Database.MYSQL,
      },
      {
        type: 'confirm',
        name: 'useDocker',
        message: 'Add Docker support?',
        default: false,
      },
      {
        type: 'confirm',
        name: 'useAuth',
        message: 'Would you like to set up authentication?',
        default: false,
      },
    ]);

    // Ask for ORM choice only if MySQL or PostgreSQL is selected
    if (
      answers.database === Database.MYSQL ||
      answers.database === Database.POSTGRES
    ) {
      const ormAnswer = await inquirer.prompt([
        {
          type: 'list',
          name: 'orm',
          message: 'Which ORM would you like to use?',
          choices: Object.values(ORM),
          default: ORM.TYPEORM,
        },
      ]);
      answers.orm = ormAnswer.orm;

      // Validate ORM compatibility
      const ormErrors = ValidationService.validateORM(
        answers.orm || '',
        answers.database,
      );
      if (ormErrors.length > 0) {
        console.warn(`⚠️  ORM validation issue: ${ormErrors[0].message}`);
      }
    }

    if (answers.useAuth) {
      const authAnswer = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'authStrategies',
          message: 'Select authentication strategies:',
          choices: [
            { name: 'JWT', value: 'jwt', checked: true },
            // { name: 'OAuth', value: 'oauth' },
            // { name: 'RBAC (Role-Based Access Control)', value: 'rbac' },
            // { name: 'Email Verification', value: 'email-verification' },
          ],
          validate: (answer) => {
            if (answer.length < 1) {
              return 'You must choose at least one authentication strategy.';
            }
            // Validate strategies
            const strategyErrors = ValidationService.validateAuthStrategies(
              (answer as unknown as string[]) || [],
            );
            if (strategyErrors.length > 0) {
              return strategyErrors[0].message;
            }
            return true;
          },
        },
      ]);
      answers.authStrategies = authAnswer.authStrategies;
    }

    return answers as ProjectAnswers;
  }
}
