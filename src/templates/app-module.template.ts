export function createAppModule(): string {
  return `import { Module } from '@nestjs/common';
  import { AppController } from './app.controller';
  import { AppService } from './app.service';
  import {DatabaseModule} from './database/database.module';
  import { ConfigModule } from '@nestjs/config';
  import { TypeOrmModule } from '@nestjs/typeorm';
  
  @Module({
    imports: [ 
      ConfigModule.forRoot({
        isGlobal: true, // makes configModule available globally
        envFilePath: '.env', // path to your .env file
        cache: true, // caches env variables for better performance
      }),
      DatabaseModule, // import the DatabaseModule here
    ],
    controllers: [AppController],
    providers: [AppService],
  })
  export class AppModule {}
  `;
}
