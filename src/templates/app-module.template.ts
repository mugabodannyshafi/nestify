import { Database, ORM } from '../constants/enums';

export function createAppModule(database?: Database, orm?: ORM): string {
  let imports = '';
  let modules = '';

  if (database) {
    if (orm === ORM.PRISMA) {
      imports = `import { PrismaModule } from './prisma/prisma.module';`;
      modules = 'PrismaModule,';
    } else {
      imports = `import { DatabaseModule } from './database/database.module';`;
      modules = 'DatabaseModule,';
    }
  }

  return `import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
${imports}

@Module({
  imports: [ 
    ConfigModule.forRoot({
      isGlobal: true, // makes configModule available globally
      envFilePath: '.env', // path to your .env file
      cache: true, // caches env variables for better performance
    }),
    ${modules}
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`;
}
