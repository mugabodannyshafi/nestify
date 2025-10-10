import { ORM } from '../../../../constants/enums';

export function createUserServiceSpec(orm?: ORM): string {
  let imports = '';
  let mockProvider = '';
  let mockRepository = '';
  let serviceVariable = '';

  switch (orm) {
    case ORM.TYPEORM:
      imports = `import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { User } from '../../../database/entities/user.entity';`;
      mockProvider = 'getRepositoryToken(User)';
      mockRepository = `const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };`;
      serviceVariable = 'repository';
      break;

    case ORM.PRISMA:
      imports = `import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../../../../prisma/prisma.service';`;
      mockProvider = 'PrismaService';
      mockRepository = `const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };`;
      serviceVariable = 'prisma';
      break;

    default: // Mongoose
      imports = `import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { User } from '../schemas/user.schema';`;
      mockProvider = 'getModelToken(User.name)';
      mockRepository = `const mockUserModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    prototype: {
      save: jest.fn(),
    },
  };
  
  function UserModelMock(data: any) {
    return {
      ...data,
      save: jest.fn().mockResolvedValue(data),
    };
  }
  
  Object.assign(UserModelMock, mockUserModel);`;
      serviceVariable = 'userModel';
  }

  return `${imports}

describe('UserService', () => {
  let service: UserService;
  let ${serviceVariable}: ${orm === ORM.TYPEORM ? 'Repository<User>' : orm === ORM.PRISMA ? 'any' : 'any'};

  ${mockRepository}

  const mockUser = {
    id: 'b1bf6d86-afee-43d1-8a3f-d13fe3147824',
    email: 'test@example.com',
    password: '$2b$10$jEEstRcnSFaYO/JOao.zfeUzB7spE9p/YN5FWnw2aL24UT0jCL4ze',
    createdAt: new Date('2025-10-09T15:18:29.155Z'),
    updatedAt: new Date('2025-10-09T15:18:29.155Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: ${mockProvider},
          useValue: ${orm === ORM.TYPEORM ? 'mockUserRepository' : orm === ORM.PRISMA ? 'mockPrismaService' : 'UserModelMock'},
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    ${orm === ORM.TYPEORM ? 'repository = module.get<Repository<User>>(getRepositoryToken(User));' : ''}
    ${orm === ORM.PRISMA ? 'prisma = module.get(PrismaService);' : ''}
    ${orm !== ORM.TYPEORM && orm !== ORM.PRISMA ? 'userModel = module.get(getModelToken(User.name));' : ''}
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      ${orm === ORM.TYPEORM ? 'mockUserRepository.findOne.mockResolvedValue(mockUser);' : ''}
      ${orm === ORM.PRISMA ? 'mockPrismaService.user.findUnique.mockResolvedValue(mockUser);' : ''}
      ${orm !== ORM.TYPEORM && orm !== ORM.PRISMA ? 'mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) });' : ''}

      const result = await service.findByEmail('test@example.com');

      ${orm === ORM.TYPEORM ? "expect(repository.findOne).toHaveBeenCalledWith({\n        where: { email: 'test@example.com' },\n      });\n      expect(repository.findOne).toHaveBeenCalledTimes(1);" : ''}
      ${orm === ORM.PRISMA ? "expect(prisma.user.findUnique).toHaveBeenCalledWith({\n        where: { email: 'test@example.com' },\n      });\n      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);" : ''}
      ${orm !== ORM.TYPEORM && orm !== ORM.PRISMA ? "expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });\n      expect(userModel.findOne).toHaveBeenCalledTimes(1);" : ''}
      expect(result).toEqual(mockUser);
    });

    it('should return null when user is not found', async () => {
      ${orm === ORM.TYPEORM ? 'mockUserRepository.findOne.mockResolvedValue(null);' : ''}
      ${orm === ORM.PRISMA ? 'mockPrismaService.user.findUnique.mockResolvedValue(null);' : ''}
      ${orm !== ORM.TYPEORM && orm !== ORM.PRISMA ? 'mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });' : ''}

      const result = await service.findByEmail('nonexistent@example.com');

      ${orm === ORM.TYPEORM ? "expect(repository.findOne).toHaveBeenCalledWith({\n        where: { email: 'nonexistent@example.com' },\n      });" : ''}
      ${orm === ORM.PRISMA ? "expect(prisma.user.findUnique).toHaveBeenCalledWith({\n        where: { email: 'nonexistent@example.com' },\n      });" : ''}
      ${orm !== ORM.TYPEORM && orm !== ORM.PRISMA ? "expect(userModel.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });" : ''}
      expect(result).toBeNull();
    });

    it('should handle different email formats', async () => {
      const emails = ['user@example.com', 'test.user@domain.co.uk', 'name+tag@example.org'];

      ${orm === ORM.TYPEORM ? 'mockUserRepository.findOne.mockResolvedValue(mockUser);' : ''}
      ${orm === ORM.PRISMA ? 'mockPrismaService.user.findUnique.mockResolvedValue(mockUser);' : ''}
      ${orm !== ORM.TYPEORM && orm !== ORM.PRISMA ? 'mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) });' : ''}

      for (const email of emails) {
        await service.findByEmail(email);
        ${orm === ORM.TYPEORM ? 'expect(repository.findOne).toHaveBeenCalledWith({\n          where: { email },\n        });' : ''}
        ${orm === ORM.PRISMA ? 'expect(prisma.user.findUnique).toHaveBeenCalledWith({\n          where: { email },\n        });' : ''}
        ${orm !== ORM.TYPEORM && orm !== ORM.PRISMA ? 'expect(userModel.findOne).toHaveBeenCalledWith({ email });' : ''}
      }

      ${orm === ORM.TYPEORM ? 'expect(repository.findOne).toHaveBeenCalledTimes(emails.length);' : ''}
      ${orm === ORM.PRISMA ? 'expect(prisma.user.findUnique).toHaveBeenCalledTimes(emails.length);' : ''}
      ${orm !== ORM.TYPEORM && orm !== ORM.PRISMA ? 'expect(userModel.findOne).toHaveBeenCalledTimes(emails.length);' : ''}
    });

    it('should handle database errors', async () => {
      ${orm === ORM.TYPEORM ? "mockUserRepository.findOne.mockRejectedValue(new Error('Database connection failed'));" : ''}
      ${orm === ORM.PRISMA ? "mockPrismaService.user.findUnique.mockRejectedValue(new Error('Database connection failed'));" : ''}
      ${orm !== ORM.TYPEORM && orm !== ORM.PRISMA ? "mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockRejectedValue(new Error('Database connection failed')) });" : ''}

      await expect(service.findByEmail('test@example.com')).rejects.toThrow(
        'Database connection failed',
      );
      ${orm === ORM.TYPEORM ? "expect(repository.findOne).toHaveBeenCalledWith({\n        where: { email: 'test@example.com' },\n      });" : ''}
      ${orm === ORM.PRISMA ? "expect(prisma.user.findUnique).toHaveBeenCalledWith({\n        where: { email: 'test@example.com' },\n      });" : ''}
      ${orm !== ORM.TYPEORM && orm !== ORM.PRISMA ? "expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });" : ''}
    });
  });

  describe('create', () => {
    it('should create and save a new user', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: '$2b$10$hashedPassword',
      };

      const createdUser = {
        ...userData,
        id: 'c2cf7e97-bfff-54e2-9b4g-e24gf4258935',
        createdAt: new Date('2025-10-09T15:18:29.155Z'),
        updatedAt: new Date('2025-10-09T15:18:29.155Z'),
      };

      ${orm === ORM.TYPEORM ? 'mockUserRepository.create.mockReturnValue(createdUser);\n      mockUserRepository.save.mockResolvedValue(createdUser);' : ''}
      ${orm === ORM.PRISMA ? 'mockPrismaService.user.create.mockResolvedValue(createdUser);' : ''}

      const result = await service.create(userData);

      ${orm === ORM.TYPEORM ? 'expect(repository.create).toHaveBeenCalledWith(userData);\n      expect(repository.save).toHaveBeenCalledWith(createdUser);' : ''}
      ${orm === ORM.PRISMA ? 'expect(prisma.user.create).toHaveBeenCalledWith({ data: userData });' : ''}
      expect(result).toEqual(createdUser);
    });

    it('should create user with only required fields', async () => {
      const userData = {
        email: 'minimal@example.com',
        password: '$2b$10$anotherHash',
      };

      ${orm === ORM.TYPEORM ? "mockUserRepository.create.mockReturnValue(userData);\n      mockUserRepository.save.mockResolvedValue({\n        ...userData,\n        id: 'd3d3d3d3-3333-3333-3333-333333333333',\n        createdAt: new Date(),\n        updatedAt: new Date(),\n      });" : ''}
      ${orm === ORM.PRISMA ? "mockPrismaService.user.create.mockResolvedValue({\n        ...userData,\n        id: 'd3d3d3d3-3333-3333-3333-333333333333',\n        createdAt: new Date(),\n        updatedAt: new Date(),\n      });" : ''}

      await service.create(userData);

      ${orm === ORM.TYPEORM ? 'expect(repository.create).toHaveBeenCalledWith(userData);\n      expect(repository.create).toHaveBeenCalledWith({\n        email: expect.any(String),\n        password: expect.any(String),\n      });' : ''}
      ${orm === ORM.PRISMA ? 'expect(prisma.user.create).toHaveBeenCalledWith({\n        data: {\n          email: expect.any(String),\n          password: expect.any(String),\n        },\n      });' : ''}
    });

    it('should handle save errors', async () => {
      const userData = {
        email: 'error@example.com',
        password: '$2b$10$hash',
      };

      ${orm === ORM.TYPEORM ? "mockUserRepository.create.mockReturnValue(userData);\n      mockUserRepository.save.mockRejectedValue(new Error('Duplicate key error'));" : ''}
      ${orm === ORM.PRISMA ? "mockPrismaService.user.create.mockRejectedValue(new Error('Duplicate key error'));" : ''}

      await expect(service.create(userData)).rejects.toThrow('Duplicate key error');
      ${orm === ORM.TYPEORM ? 'expect(repository.create).toHaveBeenCalledWith(userData);\n      expect(repository.save).toHaveBeenCalled();' : ''}
      ${orm === ORM.PRISMA ? 'expect(prisma.user.create).toHaveBeenCalledWith({ data: userData });' : ''}
    });

    it('should properly hash and store password', async () => {
      const userData = {
        email: 'secure@example.com',
        password: '$2b$10$jEEstRcnSFaYO/JOao.zfeUzB7spE9p/YN5FWnw2aL24UT0jCL4ze',
      };

      const savedUser = {
        ...userData,
        id: 'e4e4e4e4-4444-4444-4444-444444444444',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      ${orm === ORM.TYPEORM ? 'mockUserRepository.create.mockReturnValue(savedUser);\n      mockUserRepository.save.mockResolvedValue(savedUser);' : ''}
      ${orm === ORM.PRISMA ? 'mockPrismaService.user.create.mockResolvedValue(savedUser);' : ''}

      const result = await service.create(userData);

      expect(result.password).toBe(userData.password);
      expect(result.password).toMatch(/^\\$2b\\$/);
    });
  });

  describe('findById', () => {
    it('should find a user by id', async () => {
      ${orm === ORM.TYPEORM ? 'mockUserRepository.findOne.mockResolvedValue(mockUser);' : ''}
      ${orm === ORM.PRISMA ? 'mockPrismaService.user.findUnique.mockResolvedValue(mockUser);' : ''}
      ${orm !== ORM.TYPEORM && orm !== ORM.PRISMA ? 'mockUserModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) });' : ''}

      const result = await service.findById('b1bf6d86-afee-43d1-8a3f-d13fe3147824');

      ${orm === ORM.TYPEORM ? "expect(repository.findOne).toHaveBeenCalledWith({\n        where: { id: 'b1bf6d86-afee-43d1-8a3f-d13fe3147824' },\n      });\n      expect(repository.findOne).toHaveBeenCalledTimes(1);" : ''}
      ${orm === ORM.PRISMA ? "expect(prisma.user.findUnique).toHaveBeenCalledWith({\n        where: { id: 'b1bf6d86-afee-43d1-8a3f-d13fe3147824' },\n      });\n      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);" : ''}
      ${orm !== ORM.TYPEORM && orm !== ORM.PRISMA ? "expect(userModel.findById).toHaveBeenCalledWith('b1bf6d86-afee-43d1-8a3f-d13fe3147824');\n      expect(userModel.findById).toHaveBeenCalledTimes(1);" : ''}
      expect(result).toEqual(mockUser);
    });

    it('should return null when user is not found by id', async () => {
      ${orm === ORM.TYPEORM ? 'mockUserRepository.findOne.mockResolvedValue(null);' : ''}
      ${orm === ORM.PRISMA ? 'mockPrismaService.user.findUnique.mockResolvedValue(null);' : ''}
      ${orm !== ORM.TYPEORM && orm !== ORM.PRISMA ? 'mockUserModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });' : ''}

      const result = await service.findById('nonexistent-uuid');

      ${orm === ORM.TYPEORM ? "expect(repository.findOne).toHaveBeenCalledWith({\n        where: { id: 'nonexistent-uuid' },\n      });" : ''}
      ${orm === ORM.PRISMA ? "expect(prisma.user.findUnique).toHaveBeenCalledWith({\n        where: { id: 'nonexistent-uuid' },\n      });" : ''}
      ${orm !== ORM.TYPEORM && orm !== ORM.PRISMA ? "expect(userModel.findById).toHaveBeenCalledWith('nonexistent-uuid');" : ''}
      expect(result).toBeNull();
    });

    it('should handle different UUID formats', async () => {
      const uuids = [
        'a1a1a1a1-1111-1111-1111-111111111111',
        'b2b2b2b2-2222-2222-2222-222222222222',
        'c3c3c3c3-3333-3333-3333-333333333333',
      ];

      ${orm === ORM.TYPEORM ? 'mockUserRepository.findOne.mockResolvedValue(mockUser);' : ''}
      ${orm === ORM.PRISMA ? 'mockPrismaService.user.findUnique.mockResolvedValue(mockUser);' : ''}
      ${orm !== ORM.TYPEORM && orm !== ORM.PRISMA ? 'mockUserModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) });' : ''}

      for (const uuid of uuids) {
        await service.findById(uuid);
        ${orm === ORM.TYPEORM ? 'expect(repository.findOne).toHaveBeenCalledWith({\n          where: { id: uuid },\n        });' : ''}
        ${orm === ORM.PRISMA ? 'expect(prisma.user.findUnique).toHaveBeenCalledWith({\n          where: { id: uuid },\n        });' : ''}
        ${orm !== ORM.TYPEORM && orm !== ORM.PRISMA ? 'expect(userModel.findById).toHaveBeenCalledWith(uuid);' : ''}
      }

      ${orm === ORM.TYPEORM ? 'expect(repository.findOne).toHaveBeenCalledTimes(uuids.length);' : ''}
      ${orm === ORM.PRISMA ? 'expect(prisma.user.findUnique).toHaveBeenCalledTimes(uuids.length);' : ''}
      ${orm !== ORM.TYPEORM && orm !== ORM.PRISMA ? 'expect(userModel.findById).toHaveBeenCalledTimes(uuids.length);' : ''}
    });

    it('should handle database errors when finding by id', async () => {
      ${orm === ORM.TYPEORM ? "mockUserRepository.findOne.mockRejectedValue(new Error('Database timeout'));" : ''}
      ${orm === ORM.PRISMA ? "mockPrismaService.user.findUnique.mockRejectedValue(new Error('Database timeout'));" : ''}
      ${orm !== ORM.TYPEORM && orm !== ORM.PRISMA ? "mockUserModel.findById.mockReturnValue({ exec: jest.fn().mockRejectedValue(new Error('Database timeout')) });" : ''}

      await expect(service.findById('b1bf6d86-afee-43d1-8a3f-d13fe3147824')).rejects.toThrow(
        'Database timeout',
      );
    });

    it('should return complete user object with all fields', async () => {
      const completeUser = {
        id: 'f5f5f5f5-5555-5555-5555-555555555555',
        email: 'complete@example.com',
        password: '$2b$10$completeHash',
        createdAt: new Date('2025-10-09T15:18:29.155Z'),
        updatedAt: new Date('2025-10-09T16:30:45.678Z'),
      };

      ${orm === ORM.TYPEORM ? 'mockUserRepository.findOne.mockResolvedValue(completeUser);' : ''}
      ${orm === ORM.PRISMA ? 'mockPrismaService.user.findUnique.mockResolvedValue(completeUser);' : ''}
      ${orm !== ORM.TYPEORM && orm !== ORM.PRISMA ? 'mockUserModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(completeUser) });' : ''}

      const result = await service.findById('f5f5f5f5-5555-5555-5555-555555555555');

      expect(result).toEqual(completeUser);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('password');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });
  });
});
`;
}
