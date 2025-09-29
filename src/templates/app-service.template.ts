export function createAppService(): string {
  return `import { Injectable } from '@nestjs/common';
  
  @Injectable()
  export class AppService {
    getHello(): string {
      return 'Welcome to your NestJS application built with nestify! 🔨';
    }
  }
  `;
}
