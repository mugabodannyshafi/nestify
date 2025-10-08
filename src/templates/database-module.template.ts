import { Database, ORM } from '../constants/enums';

export function createDatabaseModule(database: Database, orm?: ORM): string {
  // For Prisma, we don't need a database module as PrismaModule handles it
  if (orm === ORM.PRISMA) {
    return '';
  }

  if (database === Database.MONGODB) {
    return `import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const username = configService.get<string>('DB_USERNAME');
        const password = configService.get<string>('DB_PASSWORD');
        const host = configService.get<string>('DB_HOST');
        const port = configService.get<string>('DB_PORT');
        const database = configService.get<string>('DB_NAME');

        const uri = configService.get<string>('DATABASE_URL');

        return {
          uri,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
`;
  }

  return `import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: '${database}',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE', true), // set to false in production
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
`;
}
