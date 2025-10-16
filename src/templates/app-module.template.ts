import { Database, ORM } from '../constants/enums';

export function createAppModule(
  database?: Database,
  orm?: ORM,
  useAuth?: boolean,
): string {
  let imports = `import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';`;

  let modules: string[] = [
    `ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    })`,
  ];

  // Add database module imports
  if (database) {
    if (orm === ORM.PRISMA) {
      imports += `\nimport { PrismaModule } from './prisma/prisma.module';`;
      modules.push('PrismaModule');
    } else {
      imports += `\nimport { DatabaseModule } from './database/database.module';`;
      modules.push('DatabaseModule');
    }
  }

  // Add auth module import
  if (useAuth) {
    imports += `\nimport { AuthModule } from './modules/auth/auth.module';`;
    modules.push('AuthModule');
  }

  return `${imports}

@Module({
  imports: [
    ${modules.join(',\n    ')},
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`;
}
