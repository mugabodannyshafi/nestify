import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { PackageManager, Database } from '../constants/enums';

const execAsync = promisify(exec);

export class PrismaService {
  static async initializePrisma(
    projectPath: string,
    database: Database,
    packageManager: PackageManager,
    useAuth?: boolean,
  ): Promise<void> {
    const spinner = ora('Initializing Prisma...').start();

    try {
      const prismaDir = path.join(projectPath, 'prisma');
      const datasource = this.getDatasourceProvider(database);

      const prismaInitCommand = this.getPrismaInitCommand(
        packageManager,
        datasource,
      );

      const { stdout, stderr } = await execAsync(prismaInitCommand, {
        cwd: projectPath,
        timeout: 120000,
        killSignal: 'SIGKILL',
      });

      if (stderr && !stderr.includes('success')) {
        console.error(chalk.yellow('\nPrisma init stderr:'), stderr);
      }

      const schemaPath = path.join(prismaDir, 'schema.prisma');
      if (!fs.existsSync(schemaPath)) {
        throw new Error(
          `Prisma schema file was not created. Please check Prisma CLI installation.\nCommand: ${prismaInitCommand}\nstdout: ${stdout}\nstderr: ${stderr}`,
        );
      }

      await this.enhancePrismaSchema(projectPath, database, useAuth);

      spinner.succeed('Prisma initialized successfully!');
    } catch (error: any) {
      spinner.fail('Failed to initialize Prisma');
      console.error(chalk.red('\n❌ Prisma initialization error:'));
      console.error(chalk.gray(error.message));
      throw error;
    }
  }

  static async generatePrismaClient(
    projectPath: string,
    packageManager: PackageManager,
  ): Promise<void> {
    const spinner = ora('Generating Prisma Client...').start();

    try {
      const schemaPath = path.join(projectPath, 'prisma', 'schema.prisma');
      if (!fs.existsSync(schemaPath)) {
        throw new Error(
          `Prisma schema file not found at ${schemaPath}. Cannot generate Prisma Client.`,
        );
      }

      const prismaCommand = this.getPrismaGenerateCommand(packageManager);
      await execAsync(prismaCommand, {
        cwd: projectPath,
        timeout: 120000,
        killSignal: 'SIGKILL',
      });

      spinner.succeed('Prisma Client generated successfully!');
    } catch (error: any) {
      spinner.fail('Failed to generate Prisma Client');
      console.error(chalk.red('\n❌ Prisma Client generation error:'));
      console.error(chalk.gray(error.message));
      throw error;
    }
  }

  static async runMigration(
    projectPath: string,
    packageManager: PackageManager,
    migrationName: string = 'init',
  ): Promise<void> {
    const spinner = ora('Running Prisma migration...').start();

    try {
      const migrateCommand = this.getPrismaMigrateCommand(
        packageManager,
        migrationName,
      );
      await execAsync(migrateCommand, {
        cwd: projectPath,
        timeout: 120000,
        killSignal: 'SIGKILL',
      });

      spinner.succeed('Prisma migration completed successfully!');
    } catch (error: any) {
      spinner.fail('Failed to run Prisma migration');
      console.error(chalk.red('\n❌ Prisma migration error:'));
      console.error(chalk.gray(error.message));
      throw error;
    }
  }

  private static getDatasourceProvider(database: Database): string {
    const providers: Record<Database, string> = {
      [Database.MYSQL]: 'mysql',
      [Database.POSTGRES]: 'postgresql',
      [Database.MONGODB]: 'mongodb',
    };

    return providers[database];
  }

  private static getPrismaInitCommand(
    packageManager: PackageManager,
    datasource: string,
  ): string {
    const args = `init --datasource-provider ${datasource}`;

    switch (packageManager) {
      case PackageManager.YARN:
        return `yarn prisma ${args}`;
      case PackageManager.PNPM:
        return `pnpm prisma ${args}`;
      default:
        return `npx prisma ${args}`;
    }
  }

  private static getPrismaGenerateCommand(
    packageManager: PackageManager,
  ): string {
    const args = 'generate';

    switch (packageManager) {
      case PackageManager.YARN:
        return `yarn prisma ${args}`;
      case PackageManager.PNPM:
        return `pnpm prisma ${args}`;
      default:
        return `npx prisma ${args}`;
    }
  }

  private static getPrismaMigrateCommand(
    packageManager: PackageManager,
    migrationName: string,
  ): string {
    const args = `migrate dev --name ${migrationName}`;

    switch (packageManager) {
      case PackageManager.YARN:
        return `yarn prisma ${args}`;
      case PackageManager.PNPM:
        return `pnpm prisma ${args}`;
      default:
        return `npx prisma ${args}`;
    }
  }

  private static async enhancePrismaSchema(
    projectPath: string,
    database: Database,
    useAuth?: boolean,
  ): Promise<void> {
    const schemaPath = path.join(projectPath, 'prisma', 'schema.prisma');

    if (!fs.existsSync(schemaPath)) {
      throw new Error(
        `Prisma schema file not found at ${schemaPath}. Prisma init may have failed.`,
      );
    }

    let schemaContent = await fs.readFile(schemaPath, 'utf-8');

    schemaContent = schemaContent.replace(
      /generator\s+client\s+{[^}]*}/,
      `generator client {
  provider = "prisma-client-js"
}`,
    );

    const modelContent = useAuth
      ? this.getAuthModel(database)
      : this.getExampleModel(database);

    schemaContent += `\n${modelContent}`;

    await fs.writeFile(schemaPath, schemaContent);
  }

  private static getAuthModel(database: Database): string {
    if (database === Database.MONGODB) {
      return `// Authentication User model
model User {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;
    }

    // For MySQL and PostgreSQL
    return `// Authentication User model
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
}
`;
  }

  private static getExampleModel(database: Database): string {
    if (database === Database.MONGODB) {
      return `// Example models - modify according to your needs
model User {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String   @db.ObjectId
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;
    }

    // For MySQL and PostgreSQL
    return `// Example models - modify according to your needs
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?  @db.Text
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId  Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([authorId])
  @@index([published])
}
`;
  }

  static async createPrismaService(projectPath: string): Promise<void> {
    const prismaSrcPath = path.join(projectPath, 'src', 'prisma');
    fs.ensureDirSync(prismaSrcPath);

    const serviceContent = `import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to database');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from database');
  }

  async enableShutdownHooks(app: any) {
    this.$on('beforeExit' as never, async () => {
      await app.close();
    });
  }
}
`;

    await fs.writeFile(
      path.join(prismaSrcPath, 'prisma.service.ts'),
      serviceContent,
    );
  }

  static async createPrismaModule(projectPath: string): Promise<void> {
    const prismaSrcPath = path.join(projectPath, 'src', 'prisma');
    fs.ensureDirSync(prismaSrcPath);

    const moduleContent = `import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
`;

    await fs.writeFile(
      path.join(prismaSrcPath, 'prisma.module.ts'),
      moduleContent,
    );
  }
}
