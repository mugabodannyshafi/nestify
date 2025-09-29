export function createAppServiceSpec(): string {
  return `import { Test, TestingModule } from '@nestjs/testing';
  import { AppService } from './app.service';
  
  describe('AppService', () => {
    let service: AppService;
  
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [AppService],
      }).compile();
  
      service = module.get<AppService>(AppService);
    });
  
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  
    describe('getHello', () => {
      it('should return welcome message', () => {
        expect(service.getHello()).toBe('Welcome to your NestJS application built with nestify! 🔨');
      });
  
      it('should return a string', () => {
        const result = service.getHello();
        expect(typeof result).toBe('string');
      });
  
      it('should contain nestify', () => {
        const result = service.getHello();
        expect(result).toContain('nestify');
      });
    });
  });
  `;
}
