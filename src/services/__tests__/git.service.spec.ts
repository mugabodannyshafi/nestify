import { execSync } from 'child_process';
import { GitService } from '../git.service';

// Mock modules before importing
jest.mock('child_process');
jest.mock('ora');

// Import ora after mocking
import ora from 'ora';

describe('GitService', () => {
  let mockSpinner: any;
  let mockChdir: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSpinner = {
      start: jest.fn().mockReturnThis(),
      succeed: jest.fn().mockReturnThis(),
      warn: jest.fn().mockReturnThis(),
      fail: jest.fn().mockReturnThis(),
    };

    (ora as jest.Mock).mockReturnValue(mockSpinner);

    mockChdir = jest.spyOn(process, 'chdir').mockImplementation();
  });

  afterEach(() => {
    mockChdir.mockRestore();
  });

  describe('initialize', () => {
    const projectPath = '/test/project/path';

    it('should start spinner with correct message', () => {
      (execSync as jest.Mock).mockImplementation();

      GitService.initialize(projectPath);

      expect(ora).toHaveBeenCalledWith('Initializing Git repository...');
      expect(mockSpinner.start).toHaveBeenCalled();
    });

    it('should change to project directory', () => {
      (execSync as jest.Mock).mockImplementation();

      GitService.initialize(projectPath);

      expect(process.chdir).toHaveBeenCalledWith(projectPath);
    });

    it('should execute git init command', () => {
      (execSync as jest.Mock).mockImplementation();

      GitService.initialize(projectPath);

      expect(execSync).toHaveBeenCalledWith('git init', { stdio: 'ignore' });
    });

    it('should execute git add command', () => {
      (execSync as jest.Mock).mockImplementation();

      GitService.initialize(projectPath);

      expect(execSync).toHaveBeenCalledWith('git add .', { stdio: 'ignore' });
    });

    it('should execute commands in correct order', () => {
      const executionOrder: string[] = [];

      (execSync as jest.Mock).mockImplementation((command: string) => {
        executionOrder.push(command);
      });

      GitService.initialize(projectPath);

      expect(executionOrder).toEqual(['git init', 'git add .']);
    });

    it('should show success message when git commands succeed', () => {
      (execSync as jest.Mock).mockImplementation();

      GitService.initialize(projectPath);

      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        'Git repository initialized with all files staged!',
      );
    });

    it('should show warning when git init fails', () => {
      (execSync as jest.Mock).mockImplementation(() => {
        throw new Error('git command not found');
      });

      GitService.initialize(projectPath);

      expect(mockSpinner.warn).toHaveBeenCalledWith(
        'Git initialization skipped (Git may not be installed)',
      );
    });

    it('should show warning when git add fails', () => {
      (execSync as jest.Mock)
        .mockImplementationOnce(() => {})
        .mockImplementationOnce(() => {
          throw new Error('git add failed');
        });

      GitService.initialize(projectPath);

      expect(mockSpinner.warn).toHaveBeenCalledWith(
        'Git initialization skipped (Git may not be installed)',
      );
    });

    it('should not throw error when git commands fail', () => {
      (execSync as jest.Mock).mockImplementation(() => {
        throw new Error('git not found');
      });

      expect(() => GitService.initialize(projectPath)).not.toThrow();
    });

    it('should handle git not installed error gracefully', () => {
      const gitNotFoundError = new Error('git: command not found');
      (execSync as jest.Mock).mockImplementation(() => {
        throw gitNotFoundError;
      });

      GitService.initialize(projectPath);

      expect(mockSpinner.warn).toHaveBeenCalled();
      expect(mockSpinner.succeed).not.toHaveBeenCalled();
    });

    it('should suppress stdio output from git commands', () => {
      (execSync as jest.Mock).mockImplementation();

      GitService.initialize(projectPath);

      const gitInitCall = (execSync as jest.Mock).mock.calls.find(
        (call) => call[0] === 'git init',
      );
      const gitAddCall = (execSync as jest.Mock).mock.calls.find(
        (call) => call[0] === 'git add .',
      );

      expect(gitInitCall?.[1]).toEqual({ stdio: 'ignore' });
      expect(gitAddCall?.[1]).toEqual({ stdio: 'ignore' });
    });
  });
});
