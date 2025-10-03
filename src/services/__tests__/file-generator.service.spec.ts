import fs from 'fs-extra';
import path from 'path';
import { FileGeneratorService } from '../file-generator.service';
import { ProjectConfig } from '../../types/project.types';
import { PackageManager, Database } from '../../constants/enums';
import { DockerComposeGenerator } from '../../generators/docker-compose.generator';
import { GitHubActionsGenerator } from '../../generators/github-actions.generator';
import { ConfigFilesGenerator } from '../../generators/config-files.generator';
import { EnvGenerator } from '../../generators/env.generator';
import * as packageJsonTemplate from '../../templates/package-json.template';
import * as tsconfigTemplate from '../../templates/tsconfig.template';
import * as mainTemplate from '../../templates/main.template';
import * as appModuleTemplate from '../../templates/app-module.template';
import * as appControllerTemplate from '../../templates/app-controller.template';
import * as appServiceTemplate from '../../templates/app-service.template';
import * as appControllerSpecTemplate from '../../templates/app-controller.spec.template';
import * as appServiceSpecTemplate from '../../templates/app-service.spec.template';
import * as appE2ESpecTemplate from '../../templates/app-e2e-spec.template';
import * as jestE2EConfigTemplate from '../../templates/jest-e2e-config.template';
import * as readmeTemplate from '../../templates/readme.template';

jest.mock('fs-extra');
jest.mock('../../generators/docker-compose.generator');
jest.mock('../../generators/github-actions.generator');
jest.mock('../../generators/config-files.generator');
jest.mock('../../generators/env.generator');
jest.mock('../../templates/package-json.template');
jest.mock('../../templates/tsconfig.template');
jest.mock('../../templates/main.template');
jest.mock('../../templates/app-module.template');
jest.mock('../../templates/app-controller.template');
jest.mock('../../templates/app-service.template');
jest.mock('../../templates/app-controller.spec.template');
jest.mock('../../templates/app-service.spec.template');
jest.mock('../../templates/app-e2e-spec.template');
jest.mock('../../templates/jest-e2e-config.template');
jest.mock('../../templates/readme.template');

describe('FileGeneratorService', () => {
  const mockConfig: ProjectConfig = {
    name: 'test-project',
    path: '/test/path',
    answers: {
      description: 'Test description',
      author: 'Test Author',
      packageManager: PackageManager.NPM,
      useDocker: true,
      database: Database.POSTGRES,
      useSwagger: false,
      useGraphQL: false,
      useGitHubActions: false,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateBaseFiles', () => {
    it('should generate package.json with correct parameters', () => {
      const mockPackageJson = '{"name": "test"}';
      (packageJsonTemplate.createPackageJson as jest.Mock).mockReturnValue(
        mockPackageJson,
      );

      FileGeneratorService.generateBaseFiles(mockConfig);

      expect(packageJsonTemplate.createPackageJson).toHaveBeenCalledWith(
        'test-project',
        'Test description',
        'Test Author',
        undefined, // orm parameter
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/path/package.json',
        mockPackageJson,
      );
    });

    it('should generate tsconfig.json', () => {
      const mockTsConfig = '{"compilerOptions": {}}';
      (tsconfigTemplate.createTsConfig as jest.Mock).mockReturnValue(
        mockTsConfig,
      );

      FileGeneratorService.generateBaseFiles(mockConfig);

      expect(tsconfigTemplate.createTsConfig).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/path/tsconfig.json',
        mockTsConfig,
      );
    });

    it('should generate tsconfig.build.json with correct configuration', () => {
      FileGeneratorService.generateBaseFiles(mockConfig);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/path/tsconfig.build.json',
        expect.stringContaining('"extends": "./tsconfig.json"'),
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/path/tsconfig.build.json',
        expect.stringContaining('"exclude"'),
      );
    });
  });

  describe('generateSourceFiles', () => {
    it('should generate main.ts with swagger configuration', () => {
      const mockMainTs = 'main content';
      (mainTemplate.createMainTs as jest.Mock).mockReturnValue(mockMainTs);

      FileGeneratorService.generateSourceFiles(mockConfig);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/path/src/main.ts',
        mockMainTs,
      );
    });

    it('should generate app.module.ts', () => {
      const mockAppModule = 'module content';
      (appModuleTemplate.createAppModule as jest.Mock).mockReturnValue(
        mockAppModule,
      );

      FileGeneratorService.generateSourceFiles(mockConfig);

      expect(appModuleTemplate.createAppModule).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/path/src/app.module.ts',
        mockAppModule,
      );
    });

    it('should generate app.controller.ts', () => {
      const mockController = 'controller content';
      (appControllerTemplate.createAppController as jest.Mock).mockReturnValue(
        mockController,
      );

      FileGeneratorService.generateSourceFiles(mockConfig);

      expect(appControllerTemplate.createAppController).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/path/src/app.controller.ts',
        mockController,
      );
    });

    it('should generate app.service.ts', () => {
      const mockService = 'service content';
      (appServiceTemplate.createAppService as jest.Mock).mockReturnValue(
        mockService,
      );

      FileGeneratorService.generateSourceFiles(mockConfig);

      expect(appServiceTemplate.createAppService).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/path/src/app.service.ts',
        mockService,
      );
    });

    it('should generate test files', () => {
      const mockControllerSpec = 'controller spec';
      const mockServiceSpec = 'service spec';
      (
        appControllerSpecTemplate.createAppControllerSpec as jest.Mock
      ).mockReturnValue(mockControllerSpec);
      (
        appServiceSpecTemplate.createAppServiceSpec as jest.Mock
      ).mockReturnValue(mockServiceSpec);

      FileGeneratorService.generateSourceFiles(mockConfig);

      expect(
        appControllerSpecTemplate.createAppControllerSpec,
      ).toHaveBeenCalled();
      expect(appServiceSpecTemplate.createAppServiceSpec).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/path/src/app.controller.spec.ts',
        mockControllerSpec,
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/path/src/app.service.spec.ts',
        mockServiceSpec,
      );
    });
  });

  describe('generateDatabaseModule', () => {
    it('should generate database module file based on selected database', () => {
      const mockDatabaseModule = 'database module content';
      jest
        .spyOn(
          require('../../templates/database-module.template'),
          'createDatabaseModule',
        )
        .mockReturnValue(mockDatabaseModule);

      FileGeneratorService.generateDatabaseFiles(mockConfig);

      expect(fs.ensureDirSync).toHaveBeenCalledWith('/test/path/src/database');

      expect(
        require('../../templates/database-module.template')
          .createDatabaseModule,
      ).toHaveBeenCalledWith(Database.POSTGRES, undefined);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/path/src/database/database.module.ts',
        mockDatabaseModule,
      );
    });

    it('should not generate database module if no database is selected', () => {
      const configWithoutDatabase: ProjectConfig = {
        ...mockConfig,
        answers: { ...mockConfig.answers, database: undefined },
      };

      FileGeneratorService.generateDatabaseFiles(configWithoutDatabase);

      expect(fs.ensureDirSync).not.toHaveBeenCalled();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe('generateTestFiles', () => {
    it('should create test directory', () => {
      FileGeneratorService.generateTestFiles(mockConfig);

      expect(fs.ensureDirSync).toHaveBeenCalledWith('/test/path/test');
    });

    it('should generate e2e test file', () => {
      const mockE2ESpec = 'e2e spec content';
      (appE2ESpecTemplate.createAppE2ESpec as jest.Mock).mockReturnValue(
        mockE2ESpec,
      );

      FileGeneratorService.generateTestFiles(mockConfig);

      expect(appE2ESpecTemplate.createAppE2ESpec).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/path/test/app.e2e-spec.ts',
        mockE2ESpec,
      );
    });

    it('should generate jest e2e config', () => {
      const mockJestConfig = '{"preset": "ts-jest"}';
      (jestE2EConfigTemplate.createJestE2EConfig as jest.Mock).mockReturnValue(
        mockJestConfig,
      );

      FileGeneratorService.generateTestFiles(mockConfig);

      expect(jestE2EConfigTemplate.createJestE2EConfig).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/path/test/jest-e2e.json',
        mockJestConfig,
      );
    });
  });

  describe('generateEnvironmentFiles', () => {
    it('should generate environment files using EnvGenerator', () => {
      const mockEnvFiles = {
        '.env': 'ENV_VAR=value',
        '.env.example': 'ENV_VAR=',
      };
      (EnvGenerator.generate as jest.Mock).mockReturnValue(mockEnvFiles);

      FileGeneratorService.generateEnvironmentFiles(mockConfig);

      expect(EnvGenerator.generate).toHaveBeenCalledWith(mockConfig);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/path/.env',
        'ENV_VAR=value',
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/path/.env.example',
        'ENV_VAR=',
      );
    });
  });

  describe('generateConfigFiles', () => {
    it('should generate config files using ConfigFilesGenerator', () => {
      const mockConfigFiles = {
        '.eslintrc.js': 'module.exports = {}',
        '.prettierrc': '{}',
      };
      (ConfigFilesGenerator.generate as jest.Mock).mockReturnValue(
        mockConfigFiles,
      );

      FileGeneratorService.generateConfigFiles(mockConfig);

      expect(ConfigFilesGenerator.generate).toHaveBeenCalledWith(mockConfig);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/path/.eslintrc.js',
        'module.exports = {}',
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/path/.prettierrc',
        '{}',
      );
    });
  });

  describe('generateDockerFiles', () => {
    it('should generate docker files when useDocker is true', () => {
      const mockDockerFiles = {
        'docker-compose.yml': 'version: "3.8"',
        Dockerfile: 'FROM node:18',
      };
      (DockerComposeGenerator.generate as jest.Mock).mockReturnValue(
        mockDockerFiles,
      );

      FileGeneratorService.generateDockerFiles(mockConfig);

      expect(DockerComposeGenerator.generate).toHaveBeenCalledWith(mockConfig);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/path/docker-compose.yml',
        'version: "3.8"',
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/path/Dockerfile',
        'FROM node:18',
      );
    });

    it('should not generate docker files when useDocker is false', () => {
      const configWithoutDocker: ProjectConfig = {
        ...mockConfig,
        answers: { ...mockConfig.answers, useDocker: false },
      };

      FileGeneratorService.generateDockerFiles(configWithoutDocker);

      expect(DockerComposeGenerator.generate).not.toHaveBeenCalled();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe('generateGitHubActionsFiles', () => {
    it('should generate GitHub Actions workflow when useGitHubActions is true', () => {
      const mockWorkflow = 'name: Tests\non: push';
      (
        GitHubActionsGenerator.generateTestWorkflow as jest.Mock
      ).mockReturnValue(mockWorkflow);

      FileGeneratorService.generateGitHubActionsFiles(mockConfig);

      expect(fs.ensureDirSync).toHaveBeenCalledWith(
        '/test/path/.github/workflows',
      );
      expect(GitHubActionsGenerator.generateTestWorkflow).toHaveBeenCalledWith(
        PackageManager.NPM,
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/path/.github/workflows/tests.yml',
        mockWorkflow,
      );
    });
  });

  describe('generateReadme', () => {
    it('should generate README with all project details', () => {
      const mockReadme = '# Test Project\n\nDescription';
      (readmeTemplate.createReadme as jest.Mock).mockReturnValue(mockReadme);

      FileGeneratorService.generateReadme(mockConfig);

      expect(readmeTemplate.createReadme).toHaveBeenCalledWith(
        'test-project',
        'Test description',
        PackageManager.NPM,
        true,
        undefined, // orm parameter
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/path/README.md',
        mockReadme,
      );
    });
  });
});
