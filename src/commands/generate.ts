import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import ora, { Ora } from 'ora';
import { toPascalCase } from '../utils/string.utils';
import { createGraphQLModuleTemplate } from '../templates/graphql/graphql-module.template';
import { createBaseSchemaTemplate } from '../templates/graphql/base-schema.template';
import { createExampleResolverTemplate } from '../templates/graphql/app-resolver.template';
import {
  createDataLoaderTemplate,
  createDataLoaderServiceTemplate,
} from '../templates/graphql/dataloader.template';

type Schematic = 'graphql' | 'resolver' | 'schema' | 'dataloader';

const VALID_SCHEMATICS: Schematic[] = [
  'graphql',
  'resolver',
  'schema',
  'dataloader',
];

export async function generateCommand(schematic: string, name: string) {
  const spinner = ora();

  try {
    if (!VALID_SCHEMATICS.includes(schematic as Schematic)) {
      console.log(chalk.red(`❌ Invalid schematic: ${schematic}`));
      console.log(
        chalk.cyan(`Available schematics: ${VALID_SCHEMATICS.join(', ')}`),
      );
      process.exit(1);
    }

    if (!fs.existsSync('package.json') || !fs.existsSync('src')) {
      console.log(chalk.red('❌ Not in a NestJS project directory'));
      console.log(chalk.gray('Run this command from your project root'));
      process.exit(1);
    }

    console.log(chalk.blue(`\n🚀 Generating GraphQL ${schematic}: ${name}\n`));

    switch (schematic as Schematic) {
      case 'graphql':
        await setupGraphQL(spinner);
        break;
      case 'resolver':
        await generateResolver(name, spinner);
        break;
      case 'schema':
        await generateSchema(name, spinner);
        break;
      case 'dataloader':
        await generateDataLoader(name, spinner);
        break;
    }

    console.log(
      chalk.green(
        `\n✅ Successfully generated GraphQL ${schematic}${name ? ': ' + name : ''}!`,
      ),
    );
  } catch (error) {
    spinner.fail('Failed to generate GraphQL component');
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}

async function setupGraphQL(spinner: Ora) {
  spinner.start('Setting up GraphQL configuration...');

  const graphqlPath = path.join('src', 'graphql');
  const resolversPath = path.join(graphqlPath, 'resolvers');
  const schemasPath = path.join(graphqlPath, 'schemas');
  const dataLoadersPath = path.join(graphqlPath, 'dataloaders');

  fs.ensureDirSync(resolversPath);
  fs.ensureDirSync(schemasPath);
  fs.ensureDirSync(dataLoadersPath);

  spinner.text = 'Creating GraphQL module...';
  fs.writeFileSync(
    path.join(graphqlPath, 'graphql.module.ts'),
    createGraphQLModuleTemplate(),
  );

  spinner.text = 'Creating base schema...';
  fs.writeFileSync(
    path.join(schemasPath, 'base.schema.ts'),
    createBaseSchemaTemplate(),
  );

  spinner.text = 'Creating example resolver...';
  fs.writeFileSync(
    path.join(resolversPath, 'app.resolver.ts'),
    createExampleResolverTemplate(),
  );

  spinner.text = 'Creating DataLoader service...';
  fs.writeFileSync(
    path.join(dataLoadersPath, 'dataloader.service.ts'),
    createDataLoaderServiceTemplate(),
  );

  spinner.text = 'Updating app module...';
  updateAppModuleForGraphQL();

  spinner.succeed('GraphQL setup completed!');

  console.log(chalk.cyan('\n📋 Next steps:'));
  console.log(chalk.gray('1. Install GraphQL dependencies:'));
  console.log(
    chalk.white(
      '   npm install @nestjs/graphql @nestjs/apollo @apollo/server graphql graphql-ws graphql-subscriptions dataloader',
    ),
  );
  console.log(chalk.gray('2. Generate components:'));
  console.log(chalk.white('   nestify generate resolver <name>'));
  console.log(chalk.white('   nestify generate schema <name>'));
  console.log(chalk.white('   nestify generate dataloader <name>'));
  console.log(chalk.gray('3. Start your server and visit:'));
  console.log(chalk.white('   http://localhost:3000/graphql'));
}

async function generateResolver(name: string, spinner: Ora) {
  const resolverPath = path.join('src', 'graphql', 'resolvers');
  const fileName = `${name}.resolver.ts`;

  spinner.start('Creating resolver...');
  fs.ensureDirSync(resolverPath);

  fs.writeFileSync(
    path.join(resolverPath, fileName),
    createResolverTemplate(name),
  );

  spinner.succeed(`Resolver created: src/graphql/resolvers/${fileName}`);
}

async function generateSchema(name: string, spinner: Ora) {
  const schemaPath = path.join('src', 'graphql', 'schemas');
  const fileName = `${name}.schema.ts`;

  spinner.start('Creating schema...');
  fs.ensureDirSync(schemaPath);

  fs.writeFileSync(path.join(schemaPath, fileName), createSchemaTemplate(name));

  spinner.succeed(`Schema created: src/graphql/schemas/${fileName}`);
}

async function generateDataLoader(name: string, spinner: Ora) {
  const dataLoaderPath = path.join('src', 'graphql', 'dataloaders');
  const fileName = `${name}.dataloader.ts`;

  spinner.start('Creating DataLoader...');
  fs.ensureDirSync(dataLoaderPath);

  fs.writeFileSync(
    path.join(dataLoaderPath, fileName),
    createDataLoaderTemplate(name),
  );

  spinner.succeed(`DataLoader created: src/graphql/dataloaders/${fileName}`);
}

function createResolverTemplate(name: string): string {
  const className = toPascalCase(name);

  return `import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ${className}, Create${className}Input, Update${className}Input } from '../schemas/${name}.schema';
import { ${className}DataLoader } from '../dataloaders/${name}.dataloader';

@Resolver(() => ${className})
export class ${className}Resolver {
  constructor(private readonly ${name}DataLoader: ${className}DataLoader) {}

  @Query(() => [${className}])
  async ${name}s(): Promise<${className}[]> {
    return [];
  }

  @Query(() => ${className}, { nullable: true })
  async ${name}(@Args('id', { type: () => ID }) id: string): Promise<${className} | null> {
    return this.${name}DataLoader.load${className}(id);
  }

  @Query(() => [${className}])
  async ${name}sByIds(@Args('ids', { type: () => [ID] }) ids: string[]): Promise<(${className} | null)[]> {
    return this.${name}DataLoader.load${className}s(ids);
  }

  @Mutation(() => ${className})
  async create${className}(@Args('input') input: Create${className}Input): Promise<${className}> {
    throw new Error('Not implemented');
  }

  @Mutation(() => ${className})
  async update${className}(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: Update${className}Input,
  ): Promise<${className}> {
    this.${name}DataLoader.clear${className}(id);
    throw new Error('Not implemented');
  }

  @Mutation(() => Boolean)
  async delete${className}(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    this.${name}DataLoader.clear${className}(id);
    return false;
  }
}
`;
}

function createSchemaTemplate(name: string): string {
  const className = toPascalCase(name);

  return `import { ObjectType, Field, InputType } from '@nestjs/graphql';
import { BaseEntity } from './base.schema';

@ObjectType()
export class ${className} extends BaseEntity {
  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;
}

@InputType()
export class Create${className}Input {
  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;
}

@InputType()
export class Update${className}Input {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;
}
`;
}

function updateAppModuleForGraphQL() {
  const appModulePath = path.join('src', 'app.module.ts');

  if (!fs.existsSync(appModulePath)) {
    return;
  }

  const content = fs.readFileSync(appModulePath, 'utf8');

  if (content.includes('GraphqlModule')) {
    return;
  }

  const withImport = content.includes("from './app.service';")
    ? content.replace(
        "import { AppService } from './app.service';",
        "import { AppService } from './app.service';\nimport { GraphqlModule } from './graphql/graphql.module';",
      )
    : `import { GraphqlModule } from './graphql/graphql.module';\n${content}`;

  const withModule = /imports:\s*\[\s*\]/.test(withImport)
    ? withImport.replace(/imports:\s*\[\s*\]/, 'imports: [GraphqlModule]')
    : withImport.replace(/imports:\s*\[/, 'imports: [\n    GraphqlModule,');

  fs.writeFileSync(appModulePath, withModule);
}
