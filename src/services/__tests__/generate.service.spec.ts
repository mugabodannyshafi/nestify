import fs from 'fs-extra';
import path from 'path';
import { GenerateService } from '../generate.service';
import { Schematic } from '../../constants/enums';
import { GenerateConfig } from '../../types/project.types';

jest.mock('fs-extra');

describe('GenerateService', () => {
  const mockCwd = '/project';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(process, 'cwd').mockReturnValue(mockCwd);
    (fs.existsSync as jest.Mock).mockImplementation((p: string) => {
      if (p === path.join(mockCwd, 'src')) return true;
      return false;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('buildFileList', () => {
    it('should generate module files', () => {
      const config: GenerateConfig = {
        schematic: Schematic.MODULE,
        name: 'users',
        options: { skipSpec: false, flat: false, dryRun: false },
      };

      const files = GenerateService.buildFileList(config);

      expect(files).toHaveLength(2);
      expect(files[0].filePath).toContain('users.module.ts');
      expect(files[1].filePath).toContain('users.module.spec.ts');
    });

    it('should generate controller files', () => {
      const config: GenerateConfig = {
        schematic: Schematic.CONTROLLER,
        name: 'users',
        options: { skipSpec: false, flat: false, dryRun: false },
      };

      const files = GenerateService.buildFileList(config);

      expect(files).toHaveLength(2);
      expect(files[0].filePath).toContain('users.controller.ts');
      expect(files[1].filePath).toContain('users.controller.spec.ts');
    });

    it('should generate service files', () => {
      const config: GenerateConfig = {
        schematic: Schematic.SERVICE,
        name: 'users',
        options: { skipSpec: false, flat: false, dryRun: false },
      };

      const files = GenerateService.buildFileList(config);

      expect(files).toHaveLength(2);
      expect(files[0].filePath).toContain('users.service.ts');
      expect(files[1].filePath).toContain('users.service.spec.ts');
    });

    it('should generate guard files in common/guards', () => {
      const config: GenerateConfig = {
        schematic: Schematic.GUARD,
        name: 'auth',
        options: { skipSpec: false, flat: false, dryRun: false },
      };

      const files = GenerateService.buildFileList(config);

      expect(files).toHaveLength(2);
      expect(files[0].filePath).toContain(
        path.join('common', 'guards', 'auth.guard.ts'),
      );
      expect(files[1].filePath).toContain(
        path.join('common', 'guards', 'auth.guard.spec.ts'),
      );
    });

    it('should generate interceptor files in common/interceptors', () => {
      const config: GenerateConfig = {
        schematic: Schematic.INTERCEPTOR,
        name: 'logging',
        options: { skipSpec: false, flat: false, dryRun: false },
      };

      const files = GenerateService.buildFileList(config);

      expect(files).toHaveLength(2);
      expect(files[0].filePath).toContain(
        path.join('common', 'interceptors', 'logging.interceptor.ts'),
      );
    });

    it('should generate pipe files in common/pipes', () => {
      const config: GenerateConfig = {
        schematic: Schematic.PIPE,
        name: 'validation',
        options: { skipSpec: false, flat: false, dryRun: false },
      };

      const files = GenerateService.buildFileList(config);

      expect(files).toHaveLength(2);
      expect(files[0].filePath).toContain(
        path.join('common', 'pipes', 'validation.pipe.ts'),
      );
    });

    it('should skip spec files when skipSpec is true', () => {
      const config: GenerateConfig = {
        schematic: Schematic.SERVICE,
        name: 'users',
        options: { skipSpec: true, flat: false, dryRun: false },
      };

      const files = GenerateService.buildFileList(config);

      expect(files).toHaveLength(1);
      expect(files[0].filePath).toContain('users.service.ts');
    });

    it('should place files in src directory when flat is true', () => {
      const config: GenerateConfig = {
        schematic: Schematic.SERVICE,
        name: 'users',
        options: { skipSpec: false, flat: true, dryRun: false },
      };

      const files = GenerateService.buildFileList(config);

      expect(files[0].filePath).toBe(
        path.join(mockCwd, 'src', 'users.service.ts'),
      );
    });
  });

  describe('generate', () => {
    it('should not write files in dry-run mode', () => {
      const config: GenerateConfig = {
        schematic: Schematic.SERVICE,
        name: 'users',
        options: { skipSpec: false, flat: false, dryRun: true },
      };

      const files = GenerateService.generate(config);

      expect(files).toHaveLength(2);
      expect(fs.ensureDirSync).not.toHaveBeenCalled();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should write files when not in dry-run mode', () => {
      const config: GenerateConfig = {
        schematic: Schematic.SERVICE,
        name: 'users',
        options: { skipSpec: false, flat: false, dryRun: false },
      };

      GenerateService.generate(config);

      expect(fs.ensureDirSync).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('resolveTargetDirectory', () => {
    it('should use src directory when it exists', () => {
      const result = GenerateService.resolveTargetDirectory(
        'users',
        Schematic.SERVICE,
        false,
      );

      expect(result).toBe(path.join(mockCwd, 'src', 'users'));
    });

    it('should use cwd when src does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = GenerateService.resolveTargetDirectory(
        'users',
        Schematic.SERVICE,
        false,
      );

      expect(result).toBe(path.join(mockCwd, 'users'));
    });

    it('should place guards in common/guards', () => {
      const result = GenerateService.resolveTargetDirectory(
        'auth',
        Schematic.GUARD,
        false,
      );

      expect(result).toBe(path.join(mockCwd, 'src', 'common', 'guards'));
    });

    it('should place interceptors in common/interceptors', () => {
      const result = GenerateService.resolveTargetDirectory(
        'logging',
        Schematic.INTERCEPTOR,
        false,
      );

      expect(result).toBe(path.join(mockCwd, 'src', 'common', 'interceptors'));
    });

    it('should place pipes in common/pipes', () => {
      const result = GenerateService.resolveTargetDirectory(
        'validation',
        Schematic.PIPE,
        false,
      );

      expect(result).toBe(path.join(mockCwd, 'src', 'common', 'pipes'));
    });

    it('should return base dir when flat is true', () => {
      const result = GenerateService.resolveTargetDirectory(
        'users',
        Schematic.SERVICE,
        true,
      );

      expect(result).toBe(path.join(mockCwd, 'src'));
    });
  });

  describe('getSuffix', () => {
    it('should return correct suffix for each schematic', () => {
      expect(GenerateService.getSuffix(Schematic.MODULE)).toBe('module');
      expect(GenerateService.getSuffix(Schematic.CONTROLLER)).toBe(
        'controller',
      );
      expect(GenerateService.getSuffix(Schematic.SERVICE)).toBe('service');
      expect(GenerateService.getSuffix(Schematic.GUARD)).toBe('guard');
      expect(GenerateService.getSuffix(Schematic.INTERCEPTOR)).toBe(
        'interceptor',
      );
      expect(GenerateService.getSuffix(Schematic.PIPE)).toBe('pipe');
    });
  });

  describe('getModuleArrayKey', () => {
    it('should return controllers for controller schematic', () => {
      expect(GenerateService.getModuleArrayKey(Schematic.CONTROLLER)).toBe(
        'controllers',
      );
    });

    it('should return providers for service schematic', () => {
      expect(GenerateService.getModuleArrayKey(Schematic.SERVICE)).toBe(
        'providers',
      );
    });

    it('should return providers for guard schematic', () => {
      expect(GenerateService.getModuleArrayKey(Schematic.GUARD)).toBe(
        'providers',
      );
    });

    it('should return providers for interceptor schematic', () => {
      expect(GenerateService.getModuleArrayKey(Schematic.INTERCEPTOR)).toBe(
        'providers',
      );
    });

    it('should return providers for pipe schematic', () => {
      expect(GenerateService.getModuleArrayKey(Schematic.PIPE)).toBe(
        'providers',
      );
    });
  });

  describe('addToModuleArray', () => {
    it('should add to existing array with items', () => {
      const content = `@Module({
  controllers: [AppController],
  providers: [AppService],
})`;

      const result = GenerateService.addToModuleArray(
        content,
        'controllers',
        'UsersController',
      );

      expect(result).toContain('AppController, UsersController');
    });

    it('should add to empty array', () => {
      const content = `@Module({
  controllers: [],
  providers: [AppService],
})`;

      const result = GenerateService.addToModuleArray(
        content,
        'controllers',
        'UsersController',
      );

      expect(result).toContain('UsersController');
    });

    it('should add array key if it does not exist', () => {
      const content = `@Module({
  providers: [AppService],
})`;

      const result = GenerateService.addToModuleArray(
        content,
        'controllers',
        'UsersController',
      );

      expect(result).toContain('controllers: [UsersController]');
    });
  });

  describe('toPascalCase', () => {
    it('should convert kebab-case to PascalCase', () => {
      expect(GenerateService.toPascalCase('user-profile')).toBe('UserProfile');
    });

    it('should capitalize single word', () => {
      expect(GenerateService.toPascalCase('users')).toBe('Users');
    });

    it('should handle multiple hyphens', () => {
      expect(GenerateService.toPascalCase('my-long-name')).toBe('MyLongName');
    });
  });

  describe('getBaseName', () => {
    it('should return the base name from a simple name', () => {
      expect(GenerateService.getBaseName('users')).toBe('users');
    });

    it('should return the last segment from a path', () => {
      expect(GenerateService.getBaseName('users/admin')).toBe('admin');
    });
  });
});
