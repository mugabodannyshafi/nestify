import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import ora, { Ora } from 'ora';

type Schematic = 'graphql' | 'resolver' | 'schema';

const VALID_SCHEMATICS: Schematic[] = ['graphql', 'resolver', 'schema'];

export async function generateCommand(schematic: string, name: string) {
  const spinner = ora();

  try {
    // Validate schematic type
    if (!VALID_SCHEMATICS.includes(schematic as Schematic)) {
      console.log(chalk.red(`❌ Invalid schematic: ${schematic}`));
      console.log(
        chalk.cyan(`Available schematics: ${VALID_SCHEMATICS.join(', ')}`),
      );
      process.exit(1);
    }

    // Check if we're in a NestJS project
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

  // Check if GraphQL dependencies are installed
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const hasGraphQLDeps =
      packageJson.dependencies?.['@nestjs/graphql'] ||
      packageJson.devDependencies?.['@nestjs/graphql'];

    if (!hasGraphQLDeps) {
      spinner.warn('GraphQL dependencies not found. Installing...');
      console.log(
        chalk.yellow('\n⚠️  Installing GraphQL dependencies first...'),
      );
      console.log(
        chalk.cyan(
          'Run: npm install @nestjs/graphql @nestjs/apollo graphql apollo-server-express',
        ),
      );
      return;
    }
  }

  // Create GraphQL directories
  const graphqlPath = path.join('src', 'graphql');
  const resolversPath = path.join(graphqlPath, 'resolvers');
  const schemasPath = path.join(graphqlPath, 'schemas');

  fs.ensureDirSync(resolversPath);
  fs.ensureDirSync(schemasPath);

  // Generate GraphQL module
  spinner.text = 'Creating GraphQL module...';
  const graphqlModuleContent = createGraphQLModuleTemplate();
  fs.writeFileSync(
    path.join(graphqlPath, 'graphql.module.ts'),
    graphqlModuleContent,
  );

  // Generate base schema
  spinner.text = 'Creating base schema...';
  const baseSchemaContent = createBaseSchemaTemplate();
  fs.writeFileSync(path.join(schemasPath, 'base.schema.ts'), baseSchemaContent);

  // Generate example resolver
  spinner.text = 'Creating example resolver...';
  const exampleResolverContent = createExampleResolverTemplate();
  fs.writeFileSync(
    path.join(resolversPath, 'app.resolver.ts'),
    exampleResolverContent,
  );

  // Update app.module.ts
  spinner.text = 'Updating app module...';
  updateAppModuleForGraphQL();

  spinner.succeed('GraphQL setup completed!');

  console.log(chalk.cyan('\n📋 Next steps:'));
  console.log(chalk.gray('1. Install GraphQL dependencies:'));
  console.log(
    chalk.white(
      '   npm install @nestjs/graphql @nestjs/apollo graphql apollo-server-express',
    ),
  );
  console.log(chalk.gray('2. Start your server and visit:'));
  console.log(chalk.white('   http://localhost:3000/graphql'));
}

async function generateResolver(name: string, spinner: Ora) {
  const resolverPath = path.join('src', 'graphql', 'resolvers');
  const fileName = `${name}.resolver.ts`;

  spinner.start('Creating resolver...');
  fs.ensureDirSync(resolverPath);

  const resolverContent = createResolverTemplate(name);
  fs.writeFileSync(path.join(resolverPath, fileName), resolverContent);

  spinner.succeed(`Resolver created: src/graphql/resolvers/${fileName}`);
}

async function generateSchema(name: string, spinner: Ora) {
  const schemaPath = path.join('src', 'graphql', 'schemas');
  const fileName = `${name}.schema.ts`;

  spinner.start('Creating schema...');
  fs.ensureDirSync(schemaPath);

  const schemaContent = createSchemaTemplate(name);
  fs.writeFileSync(path.join(schemaPath, fileName), schemaContent);

  spinner.succeed(`Schema created: src/graphql/schemas/${fileName}`);
}

function createGraphQLModuleTemplate(): string {
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
      subscriptions: {
        'graphql-ws': true,
        'subscriptions-transport-ws': true,
      },
    }),
  ],
  providers: [AppResolver],
})
export class GraphqlModule {}
`;
}

function createBaseSchemaTemplate(): string {
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

@ObjectType()
export class PaginationInfo {
  @Field()
  hasNextPage: boolean;

  @Field()
  hasPreviousPage: boolean;

  @Field({ nullable: true })
  startCursor?: string;

  @Field({ nullable: true })
  endCursor?: string;
}
`;
}

function createExampleResolverTemplate(): string {
  return `import { Resolver, Query, Mutation, Args, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';

const pubSub = new PubSub();

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

  @Mutation(() => String)
  async sendNotification(@Args('message') message: string): Promise<string> {
    await pubSub.publish('notificationSent', { notification: message });
    return \`Notification sent: \${message}\`;
  }

  @Subscription(() => String)
  notification() {
    return pubSub.asyncIterator('notificationSent');
  }
}
`;
}

function createResolverTemplate(name: string): string {
  const className = toPascalCase(name);

  return `import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ${className} } from '../schemas/${name}.schema';

@Resolver(() => ${className})
export class ${className}Resolver {
  @Query(() => [${className}])
  async ${name}s(): Promise<${className}[]> {
    // TODO: Implement ${name}s query
    return [];
  }

  @Query(() => ${className}, { nullable: true })
  async ${name}(@Args('id', { type: () => ID }) id: string): Promise<${className} | null> {
    // TODO: Implement ${name} query
    return null;
  }

  @Mutation(() => ${className})
  async create${className}(
    @Args('input') input: any, // TODO: Create proper input type
  ): Promise<${className}> {
    // TODO: Implement create${className} mutation
    throw new Error('Not implemented');
  }

  @Mutation(() => ${className})
  async update${className}(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: any, // TODO: Create proper input type
  ): Promise<${className}> {
    // TODO: Implement update${className} mutation
    throw new Error('Not implemented');
  }

  @Mutation(() => Boolean)
  async delete${className}(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    // TODO: Implement delete${className} mutation
    return false;
  }
}
`;
}

function createSchemaTemplate(name: string): string {
  const className = toPascalCase(name);

  return `import { ObjectType, Field, ID, InputType } from '@nestjs/graphql';
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

  if (fs.existsSync(appModulePath)) {
    let content = fs.readFileSync(appModulePath, 'utf8');

    // Add GraphQL import if not exists
    if (!content.includes('GraphqlModule')) {
      content = content.replace(
        "import { AppService } from './app.service';",
        "import { AppService } from './app.service';\nimport { GraphqlModule } from './graphql/graphql.module';",
      );

      // Add to imports array
      content = content.replace('imports: [],', 'imports: [GraphqlModule],');

      fs.writeFileSync(appModulePath, content);
    }
  }
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}
