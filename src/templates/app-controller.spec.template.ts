export function createAppControllerSpec(): string {
  return `import { Test, TestingModule } from '@nestjs/testing';
  import { AppController } from './app.controller';
  import { AppService } from './app.service';
  
  describe('AppController', () => {
    let appController: AppController;
    let appService: AppService;
  
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [AppController],
        providers: [AppService],
      }).compile();
  
      appController = module.get<AppController>(AppController);
      appService = module.get<AppService>(AppService);
    });
  
    describe('getHello', () => {
      it('should return "Hello World!"', () => {
        const result = 'Hello World!';
        jest.spyOn(appService, 'getHello').mockImplementation(() => result);
  
        expect(appController.getHello()).toBe(result);
        expect(appService.getHello).toHaveBeenCalled();
      });
    });
  
    describe('getHealth', () => {
      it('should return health status', () => {
        const result = appController.getHealth();
        
        expect(result).toHaveProperty('status', 'ok');
        expect(result).toHaveProperty('timestamp');
      });
  
      it('should return a valid ISO timestamp', () => {
        const result = appController.getHealth() as { status: string; timestamp: string };
        const timestamp = new Date(result.timestamp);
        
        expect(timestamp).toBeInstanceOf(Date);
        expect(isNaN(timestamp.getTime())).toBe(false);
      });
    });
  });
  `;
}
