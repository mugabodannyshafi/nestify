export function createAuthControllerSpec(): string {
  return `import { Test, TestingModule } from '@nestjs/testing';
  import { AuthController } from './auth.controller';
  import { AuthService } from '../services/auth.service';
  import { RegisterDto } from '../dto/register.dto';
  import { LoginDto } from '../dto/login.dto';
  
  describe('AuthController', () => {
    let controller: AuthController;
    let authService: AuthService;
  
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
    };
  
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      password: 'hashedPassword',
    };
  
    const mockAccessToken = {
      access_token: 'jwt.token.here',
      user: {
        id: mockUser.id,
        email: mockUser.email,
      },
    };
  
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [AuthController],
        providers: [
          {
            provide: AuthService,
            useValue: mockAuthService,
          },
        ],
      }).compile();
  
      controller = module.get<AuthController>(AuthController);
      authService = module.get<AuthService>(AuthService);
    });
  
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  
    describe('register', () => {
      it('should register a new user successfully', async () => {
        const registerDto: RegisterDto = {
          email: 'newuser@example.com',
          password: 'password123',
        };
  
        mockAuthService.register.mockResolvedValue({
          id: '2',
          email: registerDto.email,
        });
  
        const result = await controller.register(registerDto);
  
        expect(authService.register).toHaveBeenCalledWith(registerDto.email, registerDto.password);
        expect(authService.register).toHaveBeenCalledTimes(1);
        expect(result).toEqual({
          id: '2',
          email: registerDto.email,
        });
      });
  
      it('should handle registration errors', async () => {
        const registerDto: RegisterDto = {
          email: 'existing@example.com',
          password: 'password123',
        };
  
        mockAuthService.register.mockRejectedValue(new Error('User already exists'));
  
        await expect(controller.register(registerDto)).rejects.toThrow('User already exists');
        expect(authService.register).toHaveBeenCalledWith(registerDto.email, registerDto.password);
      });
    });
  
    describe('login', () => {
      it('should login user and return access token', async () => {
        const loginDto: LoginDto = {
          email: 'test@example.com',
          password: 'password123',
        };
  
        const mockRequest = {
          user: mockUser,
        };
  
        mockAuthService.login.mockResolvedValue(mockAccessToken);
  
        const result = await controller.login(loginDto, mockRequest);
  
        expect(authService.login).toHaveBeenCalledWith(mockUser);
        expect(authService.login).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockAccessToken);
      });
  
      it('should handle login with invalid credentials', async () => {
        const loginDto: LoginDto = {
          email: 'test@example.com',
          password: 'wrongpassword',
        };
  
        const mockRequest = {
          user: null,
        };
  
        mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));
  
        await expect(controller.login(loginDto, mockRequest)).rejects.toThrow('Invalid credentials');
      });
    });
  
    describe('getProfile', () => {
      it('should return user profile', () => {
        const mockRequest = {
          user: {
            id: mockUser.id,
            email: mockUser.email,
          },
        };
  
        const result = controller.getProfile(mockRequest);
  
        expect(result).toEqual({
          id: mockUser.id,
          email: mockUser.email,
        });
      });
  
      it('should return complete user object from request', () => {
        const mockRequest = {
          user: {
            id: '3',
            email: 'another@example.com',
            name: 'Test User',
          },
        };
  
        const result = controller.getProfile(mockRequest);
  
        expect(result).toEqual(mockRequest.user);
      });
    });
  });
  `;
}
