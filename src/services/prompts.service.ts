import inquirer from 'inquirer';
import { ProjectAnswers } from '../types/project.types';
import { PackageManager, Database, ORM } from '../constants/enums';

export class PromptsService {
  static async getProjectDetails(
    defaultPackageManager?: string,
  ): Promise<ProjectAnswers> {
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
      },
      {
        type: 'input',
        name: 'author',
        message: 'Author:',
        default: '',
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
            return true;
          },
        },
      ]);
      answers.authStrategies = authAnswer.authStrategies;
    }

    return answers as ProjectAnswers;
  }
}
