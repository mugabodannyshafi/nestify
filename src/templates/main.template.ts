export function createMainTs(useSwagger: boolean): string {
  const swaggerImport = useSwagger
    ? `import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';\n`
    : '';

  const swaggerSetup = useSwagger
    ? `
    // Swagger documentation
    const config = new DocumentBuilder()
      .setTitle('API Documentation')
      .setDescription('The API description')
      .setVersion('1.0')
      .addTag('api')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  `
    : '';

  return `import { NestFactory } from '@nestjs/core';
  ${swaggerImport}import { AppModule } from './app.module';
  
  async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    
    // Enable CORS
    app.enableCors();
    
    // Global prefix
    app.setGlobalPrefix('api');
  ${swaggerSetup}
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(\`Application is running on: http://localhost:\${port}\`);
    ${useSwagger ? 'console.log(\`Swagger docs available at: http://localhost:\${port}/api\`);' : ''}
  }
  bootstrap();
  `;
}
