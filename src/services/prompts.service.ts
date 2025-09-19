import inquirer from 'inquirer';
import { ProjectAnswers } from '../types/project.types';
import { PackageManager, Database } from '../constants/enums';

export class PromptsService {
  static async getProjectDetails(
    defaultPackageManager?: string,
  ): Promise<ProjectAnswers> {
    return inquirer.prompt([
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
        type: 'confirm',
        name: 'useDocker',
        message: 'Add Docker support?',
        default: false,
      },
      {
        type: 'list',
        name: 'database',
        message: 'Which database would you like to use with Docker?',
        choices: Object.values(Database),
        default: Database.MYSQL,
        when: (answers) => answers.useDocker,
      },
      {
        type: 'confirm',
        name: 'useSwagger',
        message: 'Add Swagger documentation?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'useGitHubActions',
        message: 'Add GitHub Actions for CI/CD?',
        default: true,
      },
    ]);
  }
}
