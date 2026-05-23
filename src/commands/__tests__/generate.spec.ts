import { generateCommand } from '../generate';
import { GenerateService } from '../../services/generate.service';
import { Schematic } from '../../constants/enums';

jest.mock('chalk', () => ({
  red: jest.fn((str: string) => str),
  green: jest.fn((str: string) => str),
  cyan: jest.fn((str: string) => str),
  white: jest.fn((str: string) => str),
  yellow: jest.fn((str: string) => str),
}));

jest.mock('../../services/generate.service');

describe('generateCommand', () => {
  let consoleSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(generateCommand).toBeDefined();
  });

  it('should exit with error for unknown schematic', async () => {
    await generateCommand('unknown', 'test', {
      skipSpec: false,
      flat: false,
      dryRun: false,
    });

    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should resolve "mo" alias to module schematic', async () => {
    (GenerateService.generate as jest.Mock).mockReturnValue([
      { filePath: '/src/test/test.module.ts', content: '' },
    ]);

    await generateCommand('mo', 'test', {
      skipSpec: false,
      flat: false,
      dryRun: false,
    });

    expect(GenerateService.generate).toHaveBeenCalledWith(
      expect.objectContaining({ schematic: Schematic.MODULE }),
    );
  });

  it('should resolve "co" alias to controller schematic', async () => {
    (GenerateService.generate as jest.Mock).mockReturnValue([
      { filePath: '/src/test/test.controller.ts', content: '' },
    ]);

    await generateCommand('co', 'users', {
      skipSpec: false,
      flat: false,
      dryRun: false,
    });

    expect(GenerateService.generate).toHaveBeenCalledWith(
      expect.objectContaining({ schematic: Schematic.CONTROLLER }),
    );
  });

  it('should resolve "s" alias to service schematic', async () => {
    (GenerateService.generate as jest.Mock).mockReturnValue([
      { filePath: '/src/test/test.service.ts', content: '' },
    ]);

    await generateCommand('s', 'users', {
      skipSpec: false,
      flat: false,
      dryRun: false,
    });

    expect(GenerateService.generate).toHaveBeenCalledWith(
      expect.objectContaining({ schematic: Schematic.SERVICE }),
    );
  });

  it('should resolve "gu" alias to guard schematic', async () => {
    (GenerateService.generate as jest.Mock).mockReturnValue([
      { filePath: '/src/common/guards/auth.guard.ts', content: '' },
    ]);

    await generateCommand('gu', 'auth', {
      skipSpec: false,
      flat: false,
      dryRun: false,
    });

    expect(GenerateService.generate).toHaveBeenCalledWith(
      expect.objectContaining({ schematic: Schematic.GUARD }),
    );
  });

  it('should resolve "i" alias to interceptor schematic', async () => {
    (GenerateService.generate as jest.Mock).mockReturnValue([
      {
        filePath: '/src/common/interceptors/logging.interceptor.ts',
        content: '',
      },
    ]);

    await generateCommand('i', 'logging', {
      skipSpec: false,
      flat: false,
      dryRun: false,
    });

    expect(GenerateService.generate).toHaveBeenCalledWith(
      expect.objectContaining({ schematic: Schematic.INTERCEPTOR }),
    );
  });

  it('should resolve "p" alias to pipe schematic', async () => {
    (GenerateService.generate as jest.Mock).mockReturnValue([
      { filePath: '/src/common/pipes/validation.pipe.ts', content: '' },
    ]);

    await generateCommand('p', 'validation', {
      skipSpec: false,
      flat: false,
      dryRun: false,
    });

    expect(GenerateService.generate).toHaveBeenCalledWith(
      expect.objectContaining({ schematic: Schematic.PIPE }),
    );
  });

  it('should pass skipSpec option correctly', async () => {
    (GenerateService.generate as jest.Mock).mockReturnValue([
      { filePath: '/src/test/test.service.ts', content: '' },
    ]);

    await generateCommand('service', 'test', {
      skipSpec: true,
      flat: false,
      dryRun: false,
    });

    expect(GenerateService.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({ skipSpec: true }),
      }),
    );
  });

  it('should pass flat option correctly', async () => {
    (GenerateService.generate as jest.Mock).mockReturnValue([
      { filePath: '/src/test.service.ts', content: '' },
    ]);

    await generateCommand('service', 'test', {
      skipSpec: false,
      flat: true,
      dryRun: false,
    });

    expect(GenerateService.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({ flat: true }),
      }),
    );
  });

  it('should handle dry-run mode', async () => {
    (GenerateService.generate as jest.Mock).mockReturnValue([
      { filePath: '/src/test/test.service.ts', content: '' },
      { filePath: '/src/test/test.service.spec.ts', content: '' },
    ]);

    await generateCommand('service', 'test', {
      skipSpec: false,
      flat: false,
      dryRun: true,
    });

    expect(GenerateService.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({ dryRun: true }),
      }),
    );
  });

  it('should handle errors gracefully', async () => {
    (GenerateService.generate as jest.Mock).mockImplementation(() => {
      throw new Error('File system error');
    });

    await generateCommand('service', 'test', {
      skipSpec: false,
      flat: false,
      dryRun: false,
    });

    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
