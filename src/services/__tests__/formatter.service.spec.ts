import { FormatterService } from '../formatter.service';
import { execa } from 'execa';

jest.mock('execa');
jest.mock('ora', () => {
  return jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    warn: jest.fn().mockReturnThis(),
  }));
});

describe('FormatterService', () => {
  const mockProjectPath = '/path/to/project';
  let mockExeca: jest.MockedFunction<typeof execa>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockExeca = execa as jest.MockedFunction<typeof execa>;
  });

  describe('format', () => {
    it('should format code successfully', async () => {
      mockExeca.mockResolvedValue({} as any);

      await FormatterService.format(mockProjectPath, 'npm');

      expect(mockExeca).toHaveBeenCalledWith('npm', ['run', 'format'], {
        cwd: mockProjectPath,
        stdio: 'pipe',
      });
    });

    it('should handle formatting errors gracefully', async () => {
      mockExeca.mockRejectedValue(new Error('Format failed'));

      await expect(
        FormatterService.format(mockProjectPath, 'npm'),
      ).resolves.not.toThrow();
    });
  });

  describe('check', () => {
    it('should return true when format check passes', async () => {
      mockExeca.mockResolvedValue({} as any);

      const result = await FormatterService.check(mockProjectPath, 'npm');

      expect(result).toBe(true);
      expect(mockExeca).toHaveBeenCalledWith('npm', ['run', 'format:check'], {
        cwd: mockProjectPath,
        stdio: 'pipe',
      });
    });

    it('should return false when format check fails', async () => {
      mockExeca.mockRejectedValue(new Error('Check failed'));

      const result = await FormatterService.check(mockProjectPath, 'npm');

      expect(result).toBe(false);
    });
  });
});
