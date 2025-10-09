import fs from 'fs-extra';
import path from 'path';
import { ProjectConfig } from '../types/project.types';
import { getDatabaseEnvConfig } from '../constants/database-config';
import { DockerComposeGenerator } from '../generators/docker-compose.generator';
import { GitHubActionsGenerator } from '../generators/github-actions.generator';
import { ConfigFilesGenerator } from '../generators/config-files.generator';
import { EnvGenerator } from '../generators/env.generator';
import { PrismaService } from './prisma.service';

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
import { Database, ORM } from '../constants/enums';
import { PackageInstallerService } from './package-installer.service';
import { createAuthModule } from '../templates/auth/jwt/auth.module.template';
import { createAuthService } from '../templates/auth/jwt/auth.service.template';
import { createAuthController } from '../templates/auth/jwt/auth.controller.template';
import { createJwtStrategy } from '../templates/auth/jwt/jwt.strategy.template';
import { createLocalStrategy } from '../templates/auth/jwt/local.strategy.template';
import { createJwtAuthGuard } from '../templates/auth/jwt/jwt-auth.guard.template';
import { createLocalAuthGuard } from '../templates/auth/jwt/local-auth.guard.template';
import { createUserService } from '../templates/auth/jwt/user/user.service.template';
import { createUserEntityTypeORM } from '../templates/auth/jwt/user/user.entity.template';
import { createUserModule } from '../templates/auth/jwt/user/user.module.template';
import { createUserPrismaSchema } from '../templates/auth/jwt/user/user.model.template';
import { createUserSchemaMongoose } from '../templates/auth/jwt/user/user.schema.template';
import chalk from 'chalk';
import { createUserController } from '../templates/auth/jwt/user/user.controller.template';
import { createRegisterDto } from '../templates/auth/jwt/dto/register.dto.template';
import { createLoginDto } from '../templates/auth/jwt/dto/login.dto.template';

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
      createAppModule(answers.database, answers.orm, answers.useAuth),
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

    // If using Prisma, we'll initialize it using Prisma CLI later
    // For now, just create the src/prisma directory structure
    if (orm === ORM.PRISMA) {
      const prismaSrcPath = path.join(config.path, 'src/prisma');
      fs.ensureDirSync(prismaSrcPath);

      // Note: Prisma schema and client will be initialized via Prisma CLI
      // in the package installer service after dependencies are installed
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
      config.answers.orm as 'prisma' | 'typeorm' | undefined,
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

  static generateAuthFiles(config: ProjectConfig): void {
    const { path: projectPath, answers } = config;

    if (!answers.useAuth || !answers.authStrategies) {
      return;
    }

    const authPath = path.join(projectPath, 'src/modules/auth');
    const userPath = path.join(authPath, 'user');
    const controllersPath = path.join(authPath, 'controllers');
    const servicesPath = path.join(authPath, 'services');
    const dtoPath = path.join(authPath, 'dto');
    const strategiesPath = path.join(authPath, 'strategies');

    const userControllersPath = path.join(userPath, 'controllers');
    const userServicesPath = path.join(userPath, 'services');
    const userSchemasPath = path.join(userPath, 'schemas'); // For Mongoose

    const guardsPath = path.join(projectPath, 'src/common/guards');

    // Create directories
    fs.ensureDirSync(authPath);
    fs.ensureDirSync(userPath);
    fs.ensureDirSync(controllersPath);
    fs.ensureDirSync(servicesPath);
    fs.ensureDirSync(dtoPath);
    fs.ensureDirSync(strategiesPath);
    fs.ensureDirSync(userControllersPath);
    fs.ensureDirSync(userServicesPath);
    fs.ensureDirSync(guardsPath);

    if (answers.orm !== ORM.TYPEORM && answers.orm !== ORM.PRISMA) {
      fs.ensureDirSync(userSchemasPath);
    }

    // Check if JWT is selected
    if (answers.authStrategies.includes('jwt')) {
      // Generate main auth files
      fs.writeFileSync(
        path.join(authPath, 'auth.module.ts'),
        createAuthModule(answers.orm),
      );
      fs.writeFileSync(
        path.join(servicesPath, 'auth.service.ts'),
        createAuthService(),
      );
      fs.writeFileSync(
        path.join(controllersPath, 'auth.controller.ts'),
        createAuthController(),
      );

      // Generate DTOs
      fs.writeFileSync(path.join(dtoPath, 'login.dto.ts'), createLoginDto());
      fs.writeFileSync(
        path.join(dtoPath, 'register.dto.ts'),
        createRegisterDto(),
      );

      // Generate strategies
      fs.writeFileSync(
        path.join(strategiesPath, 'jwt.strategy.ts'),
        createJwtStrategy(),
      );
      fs.writeFileSync(
        path.join(strategiesPath, 'local.strategy.ts'),
        createLocalStrategy(),
      );

      // Generate guards in common folder
      fs.writeFileSync(
        path.join(guardsPath, 'jwt-auth.guard.ts'),
        createJwtAuthGuard(),
      );
      fs.writeFileSync(
        path.join(guardsPath, 'local-auth.guard.ts'),
        createLocalAuthGuard(),
      );

      // Generate user module files
      fs.writeFileSync(
        path.join(userServicesPath, 'user.service.ts'),
        createUserService(answers.orm),
      );
      fs.writeFileSync(
        path.join(userControllersPath, 'user.controller.ts'),
        createUserController(),
      );
      fs.writeFileSync(
        path.join(userPath, 'user.module.ts'),
        createUserModule(answers.orm),
      );

      // Generate ORM-specific user files
      if (answers.orm === ORM.TYPEORM) {
        const entitiesPath = path.join(projectPath, 'src/database/entities');
        fs.ensureDirSync(entitiesPath);
        fs.writeFileSync(
          path.join(entitiesPath, 'user.entity.ts'),
          createUserEntityTypeORM(),
        );
      } else if (answers.orm === ORM.PRISMA) {
        const prismaNote = createUserPrismaSchema();
        fs.writeFileSync(
          path.join(projectPath, 'PRISMA_USER_MODEL.md'),
          prismaNote,
        );
        console.log(
          chalk.yellow(
            '\n⚠️  Please add the User model to your prisma/schema.prisma file.',
          ),
        );
        console.log(
          chalk.cyan('   See PRISMA_USER_MODEL.md for the model definition.\n'),
        );
      } else {
        // Mongoose
        fs.writeFileSync(
          path.join(userSchemasPath, 'user.schema.ts'),
          createUserSchemaMongoose(),
        );
      }
    }
  }
}
