import fs from 'fs-extra';
import path from 'path';
import { ProjectConfig } from '../types/project.types';
import { getDatabaseEnvConfig } from '../constants/database-config';
import { DockerComposeGenerator } from '../generators/docker-compose.generator';
import { GitHubActionsGenerator } from '../generators/github-actions.generator';
import { ConfigFilesGenerator } from '../generators/config-files.generator';
import { EnvGenerator } from '../generators/env.generator';

import { createPackageJson } from '../templates/package-json.template';
import { createTsConfig } from '../templates/tsconfig.template';
import { createMainTs } from '../templates/main.template';
import { createAppModule } from '../templates/app-module.template';
import { createAppController } from '../templates/app-controller.template';
import { createAppService } from '../templates/app-service.template';
import { createAppControllerSpec } from '../templates/app-controller.spec.template';
import { createAppServiceSpec } from '../templates/app-service.spec.template';
import { createAppE2ESpec } from '../templates/app-e2e-spec.template';
import { createJestE2EConfig } from '../templates/jest-e2e-config.template';
import { createReadme } from '../templates/readme.template';
import { createDatabaseModule } from '../templates/database-module.template';
import { createPrismaSchema } from '../templates/prisma-schema.template';
import { createPrismaService } from '../templates/prisma-service.template';
import { createPrismaModule } from '../templates/prisma-module.template';
import { Database, ORM } from '../constants/enums';
import { PackageInstallerService } from './package-installer.service';

export class FileGeneratorService {
  static generateBaseFiles(config: ProjectConfig): void {
    const { name, path: projectPath, answers } = config;

    // Package.json
    fs.writeFileSync(
      path.join(projectPath, 'package.json'),
      createPackageJson(name, answers.description, answers.author, answers.orm),
    );

    // TypeScript configs
    fs.writeFileSync(path.join(projectPath, 'tsconfig.json'), createTsConfig());

    fs.writeFileSync(
      path.join(projectPath, 'tsconfig.build.json'),
      JSON.stringify(
        {
          extends: './tsconfig.json',
          exclude: ['node_modules', 'test', 'dist', '**/*spec.ts'],
        },
        null,
        2,
      ),
    );
    return;
  }

  static generateSourceFiles(config: ProjectConfig): void {
    const { path: projectPath, answers } = config;
    const srcPath = path.join(projectPath, 'src');

    // Main application files
    fs.writeFileSync(path.join(srcPath, 'main.ts'), createMainTs());
    fs.writeFileSync(
      path.join(srcPath, 'app.module.ts'),
      createAppModule(answers.database, answers.orm),
    );
    fs.writeFileSync(
      path.join(srcPath, 'app.controller.ts'),
      createAppController(),
    );
    fs.writeFileSync(path.join(srcPath, 'app.service.ts'), createAppService());

    // Test files
    fs.writeFileSync(
      path.join(srcPath, 'app.controller.spec.ts'),
      createAppControllerSpec(),
    );
    fs.writeFileSync(
      path.join(srcPath, 'app.service.spec.ts'),
      createAppServiceSpec(),
    );
  }

  static generateDatabaseFiles(config: ProjectConfig): void {
    const database = config.answers.database;
    const orm = config.answers.orm;

    if (!database) return;

    // If using Prisma, generate Prisma-specific files
    if (orm === ORM.PRISMA) {
      const prismaPath = path.join(config.path, 'prisma');
      fs.ensureDirSync(prismaPath);

      // Generate Prisma schema
      fs.writeFileSync(
        path.join(prismaPath, 'schema.prisma'),
        createPrismaSchema(database),
      );

      // Generate Prisma service and module in src/prisma
      const prismaSrcPath = path.join(config.path, 'src/prisma');
      fs.ensureDirSync(prismaSrcPath);

      fs.writeFileSync(
        path.join(prismaSrcPath, 'prisma.service.ts'),
        createPrismaService(),
      );

      fs.writeFileSync(
        path.join(prismaSrcPath, 'prisma.module.ts'),
        createPrismaModule(),
      );
    } else {
      // For TypeORM or Mongoose, generate database module
      const dbPath = path.join(config.path, 'src/database');
      fs.ensureDirSync(dbPath);

      const moduleContent = createDatabaseModule(database, orm);
      if (moduleContent) {
        fs.writeFileSync(
          path.join(dbPath, 'database.module.ts'),
          moduleContent,
        );
      }
    }
  }

  static generateTestFiles(config: ProjectConfig): void {
    const { path: projectPath } = config;
    const testPath = path.join(projectPath, 'test');

    fs.ensureDirSync(testPath);

    fs.writeFileSync(
      path.join(testPath, 'app.e2e-spec.ts'),
      createAppE2ESpec(),
    );

    fs.writeFileSync(
      path.join(testPath, 'jest-e2e.json'),
      createJestE2EConfig(),
    );
  }

  static generateEnvironmentFiles(config: ProjectConfig): void {
    const envFiles = EnvGenerator.generate(config);

    Object.entries(envFiles).forEach(([fileName, content]) => {
      fs.writeFileSync(path.join(config.path, fileName), content);
    });
  }

  static generateConfigFiles(config: ProjectConfig): void {
    const configFiles = ConfigFilesGenerator.generate(config);

    Object.entries(configFiles).forEach(([fileName, content]) => {
      fs.writeFileSync(path.join(config.path, fileName), content);
    });
  }

  static generateDockerFiles(config: ProjectConfig): void {
    if (!config.answers.useDocker) return;

    const dockerFiles = DockerComposeGenerator.generate(config);

    Object.entries(dockerFiles).forEach(([fileName, content]) => {
      fs.writeFileSync(path.join(config.path, fileName), content);
    });
  }

  static generateGitHubActionsFiles(config: ProjectConfig): void {
    const workflowsPath = path.join(config.path, '.github/workflows');
    fs.ensureDirSync(workflowsPath);

    const workflowContent = GitHubActionsGenerator.generateTestWorkflow(
      config.answers.packageManager,
    );

    fs.writeFileSync(path.join(workflowsPath, 'tests.yml'), workflowContent);
  }

  static generateReadme(config: ProjectConfig): void {
    const readmeContent = createReadme(
      config.name,
      config.answers.description,
      config.answers.packageManager,
      config.answers.useDocker,
    );

    fs.writeFileSync(path.join(config.path, 'README.md'), readmeContent);
  }

  static async installDependencies(config: ProjectConfig): Promise<void> {
    await PackageInstallerService.install(
      config.path,
      config.answers.packageManager,
      config.answers.database,
    );
  }
}
