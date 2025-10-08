import { PackageManager, Database, ORM } from '../constants/enums';

export interface ProjectAnswers {
  packageManager: PackageManager;
  description: string;
  author: string;
  useDocker: boolean;
  database?: Database;
  orm?: ORM;
}

export interface NewCommandOptions {
  packageManager: string;
  skipInstall: boolean;
}

export interface ProjectConfig {
  name: string;
  path: string;
  answers: ProjectAnswers;
}
