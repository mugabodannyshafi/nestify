export function createAuthServiceSpec(): string {
  return `import { Test, TestingModule } from '@nestjs/testing';
  import { ConflictException, UnauthorizedException } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';
  import { AuthService } from './auth.service';
  import { UserService } from '../../user/services/user.service';
  import * as bcrypt from 'bcrypt';
  
  jest.mock('bcrypt');
  
  describe('AuthService', () => {
    let service: AuthService;
    let userService: UserService;
    let jwtService: JwtService;
  
    const mockUserService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };
  
    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };
  
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      password: 'hashedPassword123',
    };
  
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: UserService,
            useValue: mockUserService,
          },
          {
            provide: JwtService,
            useValue: mockJwtService,
          },
        ],
      }).compile();
  
      service = module.get<AuthService>(AuthService);
      userService = module.get<UserService>(UserService);
      jwtService = module.get<JwtService>(JwtService);
    });
  
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  
    describe('validateUser', () => {
      it('should return user data without password when credentials are valid', async () => {
        mockUserService.findByEmail.mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  
        const result = await service.validateUser('test@example.com', 'password123');
  
        expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');
        expect(bcrypt.compare).toHaveBeenCalledWith('password123', mockUser.password);
        expect(result).toEqual({
          id: mockUser.id,
          email: mockUser.email,
        });
        expect(result.password).toBeUndefined();
      });
  
      it('should return null when user is not found', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);
  
        const result = await service.validateUser('nonexistent@example.com', 'password123');
  
        expect(userService.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
        expect(result).toBeNull();
      });
  
      it('should return null when password is incorrect', async () => {
        mockUserService.findByEmail.mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);
  
        const result = await service.validateUser('test@example.com', 'wrongpassword');
  
        expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');
        expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', mockUser.password);
        expect(result).toBeNull();
      });
    });
  
    describe('login', () => {
      it('should return access token and user data', async () => {
        const user = { id: '1', email: 'test@example.com' };
        const mockToken = 'jwt.token.here';
  
        mockJwtService.sign.mockReturnValue(mockToken);
  
        const result = await service.login(user);
  
        expect(jwtService.sign).toHaveBeenCalledWith({
          email: user.email,
          sub: user.id,
        });
        expect(result).toEqual({
          access_token: mockToken,
          user: {
            id: user.id,
            email: user.email,
          },
        });
      });
  
      it('should handle user with additional properties', async () => {
        const user = { id: '2', email: 'another@example.com', name: 'Test User' };
        const mockToken = 'another.jwt.token';
  
        mockJwtService.sign.mockReturnValue(mockToken);
  
        const result = await service.login(user);
  
        expect(jwtService.sign).toHaveBeenCalledWith({
          email: user.email,
          sub: user.id,
        });
        expect(result.access_token).toBe(mockToken);
        expect(result.user).toEqual({
          id: user.id,
          email: user.email,
        });
      });
    });
  
    describe('register', () => {
      it('should register a new user successfully', async () => {
        const email = 'newuser@example.com';
        const password = 'password123';
        const hashedPassword = 'hashedPassword123';
        const mockToken = 'jwt.token.here';
  
        mockUserService.findByEmail.mockResolvedValue(null);
        (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
        mockUserService.create.mockResolvedValue({
          id: '2',
          email,
          password: hashedPassword,
        });
        mockJwtService.sign.mockReturnValue(mockToken);
  
        const result = await service.register(email, password);
  
        expect(userService.findByEmail).toHaveBeenCalledWith(email);
        expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
        expect(userService.create).toHaveBeenCalledWith({
          email,
          password: hashedPassword,
        });
        expect(result).toEqual({
          access_token: mockToken,
          user: {
            id: '2',
            email,
          },
        });
      });
  
      it('should throw ConflictException when user already exists', async () => {
        const email = 'existing@example.com';
        const password = 'password123';
  
        mockUserService.findByEmail.mockResolvedValue(mockUser);
  
        await expect(service.register(email, password)).rejects.toThrow(ConflictException);
        await expect(service.register(email, password)).rejects.toThrow(
          'User with this email already exists',
        );
  
        expect(userService.findByEmail).toHaveBeenCalledWith(email);
        expect(bcrypt.hash).not.toHaveBeenCalled();
        expect(userService.create).not.toHaveBeenCalled();
      });
  
      it('should hash password with bcrypt salt rounds of 10', async () => {
        const email = 'newuser@example.com';
        const password = 'password123';
  
        mockUserService.findByEmail.mockResolvedValue(null);
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
        mockUserService.create.mockResolvedValue({
          id: '3',
          email,
          password: 'hashedPassword',
        });
        mockJwtService.sign.mockReturnValue('token');
  
        await service.register(email, password);
  
        expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      });
    });
  
    describe('validateToken', () => {
      it('should return decoded token when token is valid', async () => {
        const token = 'valid.jwt.token';
        const decodedToken = { email: 'test@example.com', sub: '1' };
  
        mockJwtService.verify.mockReturnValue(decodedToken);
  
        const result = await service.validateToken(token);
  
        expect(jwtService.verify).toHaveBeenCalledWith(token);
        expect(result).toEqual(decodedToken);
      });
  
      it('should throw UnauthorizedException when token is invalid', async () => {
        const token = 'invalid.jwt.token';
  
        mockJwtService.verify.mockImplementation(() => {
          throw new Error('Invalid token');
        });
  
        await expect(service.validateToken(token)).rejects.toThrow(UnauthorizedException);
        await expect(service.validateToken(token)).rejects.toThrow('Invalid token');
  
        expect(jwtService.verify).toHaveBeenCalledWith(token);
      });
  
      it('should throw UnauthorizedException when token is expired', async () => {
        const token = 'expired.jwt.token';
  
        mockJwtService.verify.mockImplementation(() => {
          throw new Error('Token expired');
        });
  
        await expect(service.validateToken(token)).rejects.toThrow(UnauthorizedException);
  
        expect(jwtService.verify).toHaveBeenCalledWith(token);
      });
    });
  });
  `;
}
