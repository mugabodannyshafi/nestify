export function createUserControllerSpec(): string {
  return `import { Test, TestingModule } from '@nestjs/testing';
  import { UserController } from './user.controller';
  import { UserService } from '../services/user.service';
  
  describe('UserController', () => {
    let controller: UserController;
    let userService: UserService;
  
    const mockUserService = {
      findById: jest.fn(),
    };
  
    const mockUser = {
      id: 'b1bf6d86-afee-43d1-8a3f-d13fe3147824',
      email: 'test@example.com',
      password: '$2b$10$jEEstRcnSFaYO/JOao.zfeUzB7spE9p/YN5FWnw2aL24UT0jCL4ze',
      createdAt: new Date('2025-10-09T15:18:29.155Z'),
      updatedAt: new Date('2025-10-09T15:18:29.155Z'),
    };
  
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [UserController],
        providers: [
          {
            provide: UserService,
            useValue: mockUserService,
          },
        ],
      }).compile();
  
      controller = module.get<UserController>(UserController);
      userService = module.get<UserService>(UserService);
    });
  
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  
    describe('getCurrentUser', () => {
      it('should return current user profile', async () => {
        const mockRequest = {
          user: {
            id: 'b1bf6d86-afee-43d1-8a3f-d13fe3147824',
            email: 'test@example.com',
          },
        };
  
        mockUserService.findById.mockResolvedValue(mockUser);
  
        const result = await controller.getCurrentUser(mockRequest);
  
        expect(userService.findById).toHaveBeenCalledWith('b1bf6d86-afee-43d1-8a3f-d13fe3147824');
        expect(userService.findById).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockUser);
      });
  
      it('should return user with complete profile data', async () => {
        const mockRequest = {
          user: {
            id: 'c2cf7e97-bfff-54e2-9b4g-e24gf4258935',
            email: 'another@example.com',
          },
        };
  
        const completeUser = {
          id: 'c2cf7e97-bfff-54e2-9b4g-e24gf4258935',
          email: 'another@example.com',
          password: '$2b$10$anotherHashedPassword123456789',
          createdAt: new Date('2025-10-08T10:30:00.000Z'),
          updatedAt: new Date('2025-10-09T14:45:00.000Z'),
        };
  
        mockUserService.findById.mockResolvedValue(completeUser);
  
        const result = await controller.getCurrentUser(mockRequest);
  
        expect(userService.findById).toHaveBeenCalledWith('c2cf7e97-bfff-54e2-9b4g-e24gf4258935');
        expect(result).toEqual(completeUser);
        expect(result.id).toBe('c2cf7e97-bfff-54e2-9b4g-e24gf4258935');
        expect(result.email).toBe('another@example.com');
      });
  
      it('should handle user not found', async () => {
        const mockRequest = {
          user: {
            id: 'nonexistent-id',
            email: 'test@example.com',
          },
        };
  
        mockUserService.findById.mockResolvedValue(null);
  
        const result = await controller.getCurrentUser(mockRequest);
  
        expect(userService.findById).toHaveBeenCalledWith('nonexistent-id');
        expect(result).toBeNull();
      });
  
      it('should throw error when service fails', async () => {
        const mockRequest = {
          user: {
            id: 'b1bf6d86-afee-43d1-8a3f-d13fe3147824',
            email: 'test@example.com',
          },
        };
  
        mockUserService.findById.mockRejectedValue(new Error('Database connection error'));
  
        await expect(controller.getCurrentUser(mockRequest)).rejects.toThrow(
          'Database connection error',
        );
        expect(userService.findById).toHaveBeenCalledWith('b1bf6d86-afee-43d1-8a3f-d13fe3147824');
      });
  
      it('should handle different user IDs correctly', async () => {
        const mockRequest1 = { user: { id: 'user-123' } };
        const mockRequest2 = { user: { id: 'user-456' } };
  
        const user1 = { id: 'user-123', email: 'user1@example.com' };
        const user2 = { id: 'user-456', email: 'user2@example.com' };
  
        mockUserService.findById.mockResolvedValueOnce(user1).mockResolvedValueOnce(user2);
  
        const result1 = await controller.getCurrentUser(mockRequest1);
        const result2 = await controller.getCurrentUser(mockRequest2);
  
        expect(userService.findById).toHaveBeenCalledWith('user-123');
        expect(userService.findById).toHaveBeenCalledWith('user-456');
        expect(result1).toEqual(user1);
        expect(result2).toEqual(user2);
      });
  
      it('should not expose password field in user profile', async () => {
        const mockRequest = {
          user: {
            id: '1',
            email: 'test@example.com',
          },
        };
  
        const userWithoutPassword = {
          id: '1',
          email: 'test@example.com',
          createdAt: new Date(),
        };
  
        mockUserService.findById.mockResolvedValue(userWithoutPassword);
  
        const result = await controller.getCurrentUser(mockRequest);
  
        expect(result).toEqual(userWithoutPassword);
        expect(result).not.toHaveProperty('password');
      });
    });
  });
  `;
}
