import fs from 'fs-extra';
import path from 'path';
import { ProjectConfig } from '../types/project.types';

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
import { Database } from '../constants/enums';
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
        answers.database,
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
    return;
  }

  static generateSourceFiles(config: ProjectConfig): void {
    const { path: projectPath, answers } = config;
    const srcPath = path.join(projectPath, 'src');

    // Main application files
    fs.writeFileSync(path.join(srcPath, 'main.ts'), createMainTs());
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

  static generateDatabaseFiles(config: ProjectConfig): void {
    let database = config.answers.database;
    if (!database || !config.answers.useDocker) return;

    const dbPath = path.join(config.path, 'src/database');

    fs.ensureDirSync(dbPath);

    fs.writeFileSync(
      path.join(dbPath, 'database.module.ts'),
      createDatabaseModule(database),
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
    const workflowsPath = path.join(config.path, '.github/workflows');
    fs.ensureDirSync(workflowsPath);

    const workflowContent = GitHubActionsGenerator.generateTestWorkflow(
      config.answers.packageManager,
    );

    fs.writeFileSync(path.join(workflowsPath, 'tests.yml'), workflowContent);
  }

  static generateGraphQLFiles(config: ProjectConfig): void {
    if (!config.answers.useGraphQL) return;

    const graphqlPath = path.join(config.path, 'src', 'graphql');
    const resolversPath = path.join(graphqlPath, 'resolvers');
    const schemasPath = path.join(graphqlPath, 'schemas');

    fs.ensureDirSync(resolversPath);
    fs.ensureDirSync(schemasPath);

    // Generate GraphQL module
    const graphqlModuleContent = this.createGraphQLModuleTemplate();
    fs.writeFileSync(
      path.join(graphqlPath, 'graphql.module.ts'),
      graphqlModuleContent,
    );

    // Generate base schema
    const baseSchemaContent = this.createBaseSchemaTemplate();
    fs.writeFileSync(
      path.join(schemasPath, 'base.schema.ts'),
      baseSchemaContent,
    );

    // Generate example resolver
    const exampleResolverContent = this.createExampleResolverTemplate();
    fs.writeFileSync(
      path.join(resolversPath, 'app.resolver.ts'),
      exampleResolverContent,
    );
  }

  private static createGraphQLModuleTemplate(): string {
    return `import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { AppResolver } from './resolvers/app.resolver';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: true,
      introspection: true,
    }),
  ],
  providers: [AppResolver],
})
export class GraphqlModule {}
`;
  }

  private static createBaseSchemaTemplate(): string {
    return `import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class BaseEntity {
  @Field(() => ID)
  id: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
`;
  }

  private static createExampleResolverTemplate(): string {
    return `import { Resolver, Query } from '@nestjs/graphql';

@Resolver()
export class AppResolver {
  @Query(() => String)
  hello(): string {
    return 'Hello GraphQL World!';
  }

  @Query(() => String)
  getTime(): string {
    return new Date().toISOString();
  }
}
`;
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
