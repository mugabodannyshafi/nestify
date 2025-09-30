import { newCommand } from '../new';
import { NewCommandOptions } from '../../types/project.types';
import { PromptsService } from '../../services/prompts.service';
import { FileGeneratorService } from '../../services/file-generator.service';
import { GitService } from '../../services/git.service';
import { PackageInstallerService } from '../../services/package-installer.service';
import { ConsoleMessages } from '../../utils/console-messages';
import { createProjectStructure } from '../../utils/project-structure';
import { PackageManager, Database } from '../../constants/enums';
import fs from 'fs-extra';
import path from 'path';

jest.mock('fs-extra');
jest.mock('ora', () => {
  return jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
  }));
});
jest.mock('../../services/prompts.service');
jest.mock('../../services/file-generator.service');
jest.mock('../../services/git.service');
jest.mock('../../services/package-installer.service');
jest.mock('../../utils/console-messages');
jest.mock('../../utils/project-structure');

describe('newCommand', () => {
  const mockProjectName = 'test-project';
  const mockOptions: NewCommandOptions = {
    packageManager: 'npm',
    skipInstall: false,
  };

  const mockAnswers = {
    packageManager: PackageManager.NPM,
    description: 'Test description',
    author: 'Test Author',
    useDocker: true,
    database: Database.POSTGRES,
    useSwagger: true,
    useGitHubActions: true,
  };

  const mockProjectPath = path.resolve(process.cwd(), mockProjectName);
  let mockExit: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock fs operations
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.ensureDirSync as jest.Mock).mockImplementation();

    // Mock services
    (PromptsService.getProjectDetails as jest.Mock).mockResolvedValue(
      mockAnswers,
    );
    (PackageInstallerService.install as jest.Mock).mockResolvedValue(undefined);

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: any) => {
      throw new Error(`process.exit: ${code}`);
    });
  });

  afterEach(() => {
    mockExit.mockRestore();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('successful project creation', () => {
    it('should create a new project successfully', async () => {
      await newCommand(mockProjectName, mockOptions);

      expect(fs.existsSync).toHaveBeenCalledWith(mockProjectPath);
      expect(PromptsService.getProjectDetails).toHaveBeenCalledWith('npm');
      expect(fs.ensureDirSync).toHaveBeenCalledWith(mockProjectPath);
      expect(createProjectStructure).toHaveBeenCalledWith(mockProjectPath);
    });

    it('should call prompts service with correct package manager', async () => {
      const yarnOptions: NewCommandOptions = {
        packageManager: 'yarn',
        skipInstall: false,
      };

      await newCommand(mockProjectName, yarnOptions);

      expect(PromptsService.getProjectDetails).toHaveBeenCalledWith('yarn');
    });

    it('should generate all project files', async () => {
      await newCommand(mockProjectName, mockOptions);

      expect(FileGeneratorService.generateBaseFiles).toHaveBeenCalled();
      expect(FileGeneratorService.generateSourceFiles).toHaveBeenCalled();
      expect(FileGeneratorService.generateTestFiles).toHaveBeenCalled();
      expect(FileGeneratorService.generateEnvironmentFiles).toHaveBeenCalled();
      expect(FileGeneratorService.generateConfigFiles).toHaveBeenCalled();
      expect(FileGeneratorService.generateDockerFiles).toHaveBeenCalled();
      expect(
        FileGeneratorService.generateGitHubActionsFiles,
      ).toHaveBeenCalled();
      expect(FileGeneratorService.generateReadme).toHaveBeenCalled();
    });

    it('should pass correct config to file generators', async () => {
      await newCommand(mockProjectName, mockOptions);

      const expectedConfig = {
        name: mockProjectName,
        path: mockProjectPath,
        answers: mockAnswers,
      };

      expect(FileGeneratorService.generateBaseFiles).toHaveBeenCalledWith(
        expect.objectContaining(expectedConfig),
      );
      expect(FileGeneratorService.generateSourceFiles).toHaveBeenCalledWith(
        expect.objectContaining(expectedConfig),
      );
    });

    it('should initialize git repository', async () => {
      await newCommand(mockProjectName, mockOptions);

      expect(GitService.initialize).toHaveBeenCalledWith(mockProjectPath);
    });

    it('should install dependencies when skipInstall is false', async () => {
      await newCommand(mockProjectName, mockOptions);

      expect(PackageInstallerService.install).toHaveBeenCalledWith(
        mockProjectPath,
        PackageManager.NPM,
      );
    });

    it('should skip dependency installation when skipInstall is true', async () => {
      const skipOptions: NewCommandOptions = {
        ...mockOptions,
        skipInstall: true,
      };

      await newCommand(mockProjectName, skipOptions);

      expect(PackageInstallerService.install).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Dependencies not installed'),
      );
    });

    it('should show success message', async () => {
      await newCommand(mockProjectName, mockOptions);

      expect(ConsoleMessages.showSuccess).toHaveBeenCalled();
    });

    it('should display project creation message', async () => {
      await newCommand(mockProjectName, mockOptions);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Creating project: ${mockProjectName}`),
      );
    });
  });

  describe('error handling', () => {
    it('should exit if project directory already exists', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await expect(newCommand(mockProjectName, mockOptions)).rejects.toThrow(
        'process.exit: 1',
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('already exists'),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle errors during project creation', async () => {
      const error = new Error('Test error');
      (fs.ensureDirSync as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await expect(newCommand(mockProjectName, mockOptions)).rejects.toThrow(
        'process.exit: 1',
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error:'),
        error,
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle errors during prompts', async () => {
      const error = new Error('Prompts error');
      (PromptsService.getProjectDetails as jest.Mock).mockRejectedValue(error);

      await expect(newCommand(mockProjectName, mockOptions)).rejects.toThrow(
        'process.exit: 1',
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle errors during installation', async () => {
      const error = new Error('Installation error');
      (PackageInstallerService.install as jest.Mock).mockRejectedValue(error);

      await expect(newCommand(mockProjectName, mockOptions)).rejects.toThrow(
        'process.exit: 1',
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('project configuration', () => {
    it('should create correct ProjectConfig object', async () => {
      await newCommand(mockProjectName, mockOptions);

      expect(FileGeneratorService.generateBaseFiles).toHaveBeenCalledWith(
        expect.objectContaining({
          name: mockProjectName,
          path: mockProjectPath,
          answers: mockAnswers,
        }),
      );
    });

    it('should resolve project path from current directory', async () => {
      await newCommand(mockProjectName, mockOptions);

      expect(fs.ensureDirSync).toHaveBeenCalledWith(
        expect.stringContaining(mockProjectName),
      );
    });

    it('should use absolute path for project', async () => {
      await newCommand(mockProjectName, mockOptions);

      const calls = (fs.ensureDirSync as jest.Mock).mock.calls;
      const pathArg = calls[0][0];

      expect(path.isAbsolute(pathArg)).toBe(true);
    });
  });
});
