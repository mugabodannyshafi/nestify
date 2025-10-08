import { PrismaService } from '../prisma.service';
import { Database, PackageManager } from '../../constants/enums';
import { exec } from 'child_process';
import fs from 'fs-extra';

jest.mock('child_process');
jest.mock('fs-extra');
jest.mock('ora', () => {
  return jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
  }));
});

describe('PrismaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializePrisma', () => {
    it('should initialize Prisma with MySQL', async () => {
      const mockExec = exec as unknown as jest.Mock;
      mockExec.mockImplementation((_cmd, _opts, callback) => {
        callback(null, { stdout: '', stderr: '' });
        return {} as any;
      });

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFile as unknown as jest.Mock).mockResolvedValue(
        'generator client {\n  provider = "prisma-client-js"\n}\n\ndatasource db {\n  provider = "mysql"\n  url      = env("DATABASE_URL")\n}\n',
      );
      (fs.writeFile as unknown as jest.Mock).mockResolvedValue(undefined);

      await PrismaService.initializePrisma(
        '/test/path',
        Database.MYSQL,
        PackageManager.NPM,
      );

      expect(mockExec).toHaveBeenCalled();
    });

    it('should initialize Prisma with PostgreSQL', async () => {
      const mockExec = exec as unknown as jest.Mock;
      mockExec.mockImplementation((_cmd, _opts, callback) => {
        callback(null, { stdout: '', stderr: '' });
        return {} as any;
      });

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFile as unknown as jest.Mock).mockResolvedValue(
        'generator client {\n  provider = "prisma-client-js"\n}\n\ndatasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n',
      );
      (fs.writeFile as unknown as jest.Mock).mockResolvedValue(undefined);

      await PrismaService.initializePrisma(
        '/test/path',
        Database.POSTGRES,
        PackageManager.YARN,
      );

      expect(mockExec).toHaveBeenCalled();
    });

    it('should throw error if schema file is not created after init', async () => {
      const mockExec = exec as unknown as jest.Mock;
      mockExec.mockImplementation((_cmd, _opts, callback) => {
        callback(null, { stdout: '', stderr: '' });
        return {} as any;
      });

      (fs.ensureDirSync as jest.Mock).mockReturnValue(undefined);
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(
        PrismaService.initializePrisma(
          '/test/path',
          Database.MYSQL,
          PackageManager.NPM,
        ),
      ).rejects.toThrow('Prisma schema file was not created');
    });
  });

  describe('generatePrismaClient', () => {
    it('should generate Prisma client with npm', async () => {
      const mockExec = exec as unknown as jest.Mock;
      mockExec.mockImplementation((_cmd, _opts, callback) => {
        callback(null, { stdout: '', stderr: '' });
        return {} as any;
      });

      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await PrismaService.generatePrismaClient(
        '/test/path',
        PackageManager.NPM,
      );

      expect(fs.existsSync).toHaveBeenCalledWith(
        '/test/path/prisma/schema.prisma',
      );
      expect(mockExec).toHaveBeenCalled();
    });

    it('should generate Prisma client with yarn', async () => {
      const mockExec = exec as unknown as jest.Mock;
      mockExec.mockImplementation((_cmd, _opts, callback) => {
        callback(null, { stdout: '', stderr: '' });
        return {} as any;
      });

      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await PrismaService.generatePrismaClient(
        '/test/path',
        PackageManager.YARN,
      );

      expect(fs.existsSync).toHaveBeenCalledWith(
        '/test/path/prisma/schema.prisma',
      );
      expect(mockExec).toHaveBeenCalled();
    });

    it('should throw error if schema file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(
        PrismaService.generatePrismaClient('/test/path', PackageManager.NPM),
      ).rejects.toThrow('Prisma schema file not found');
    });
  });

  describe('createPrismaService', () => {
    it('should create Prisma service file', async () => {
      (fs.ensureDirSync as jest.Mock).mockReturnValue(undefined);
      (fs.writeFile as unknown as jest.Mock).mockResolvedValue(undefined);

      await PrismaService.createPrismaService('/test/path');

      expect(fs.ensureDirSync).toHaveBeenCalledWith('/test/path/src/prisma');
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/test/path/src/prisma/prisma.service.ts',
        expect.stringContaining('PrismaService'),
      );
    });
  });

  describe('createPrismaModule', () => {
    it('should create Prisma module file', async () => {
      (fs.ensureDirSync as jest.Mock).mockReturnValue(undefined);
      (fs.writeFile as unknown as jest.Mock).mockResolvedValue(undefined);

      await PrismaService.createPrismaModule('/test/path');

      expect(fs.ensureDirSync).toHaveBeenCalledWith('/test/path/src/prisma');
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/test/path/src/prisma/prisma.module.ts',
        expect.stringContaining('PrismaModule'),
      );
    });
  });
});
