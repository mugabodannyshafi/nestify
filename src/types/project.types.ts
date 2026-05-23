import { PackageManager, Database, ORM, Schematic } from '../constants/enums';

export interface ProjectAnswers {
  packageManager: PackageManager;
  description: string;
  author: string;
  useDocker: boolean;
  database?: Database;
  orm?: ORM;
  useAuth?: boolean;
  authStrategies?: string[];
}

export interface NewCommandOptions {
  packageManager: string;
  skipInstall: boolean;
  noGit?: boolean;
}

export interface ProjectConfig {
  name: string;
  path: string;
  answers: ProjectAnswers;
}

export interface GenerateCommandOptions {
  skipSpec: boolean;
  flat: boolean;
  dryRun: boolean;
}

export interface GenerateConfig {
  schematic: Schematic;
  name: string;
  options: GenerateCommandOptions;
}
