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
import { PackageInstallerService } from './package-installer.service';

export class FileGeneratorService {
  static generateBaseFiles(config: ProjectConfig): void {
    const { name, path: projectPath, answers } = config;

    // Package.json
    fs.writeFileSync(
      path.join(projectPath, 'package.json'),
      createPackageJson(
        name,
        answers.description,
        answers.author,
        answers.useSwagger,
      ),
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
  }

  static generateSourceFiles(config: ProjectConfig): void {
    const { path: projectPath, answers } = config;
    const srcPath = path.join(projectPath, 'src');

    // Main application files
    fs.writeFileSync(
      path.join(srcPath, 'main.ts'),
      createMainTs(answers.useSwagger),
    );
    fs.writeFileSync(path.join(srcPath, 'app.module.ts'), createAppModule());
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
    if (!config.answers.useGitHubActions) return;

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
      config.answers.useGitHubActions,
    );

    fs.writeFileSync(path.join(config.path, 'README.md'), readmeContent);
  }

  static async installDependencies(config: ProjectConfig): Promise<void> {
    await PackageInstallerService.install(
      config.path,
      config.answers.packageManager,
      config.answers.useSwagger,
    );
  }
}
