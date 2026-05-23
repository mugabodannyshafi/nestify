import { shouldSuppressBanner, printBanner } from '../banner';

jest.mock('chalk', () => ({
  blue: jest.fn((str: string) => str),
}));

describe('banner', () => {
  const originalEnv = process.env;
  let originalIsTTY: boolean | undefined;

  beforeEach(() => {
    process.env = { ...originalEnv };
    originalIsTTY = process.stdout.isTTY;
  });

  afterEach(() => {
    process.env = originalEnv;
    Object.defineProperty(process.stdout, 'isTTY', {
      value: originalIsTTY,
      writable: true,
    });
  });

  describe('shouldSuppressBanner', () => {
    it('should suppress when --help is present', () => {
      expect(shouldSuppressBanner(['node', 'nestify', '--help'])).toBe(true);
    });

    it('should suppress when -h is present', () => {
      expect(shouldSuppressBanner(['node', 'nestify', '-h'])).toBe(true);
    });

    it('should suppress when --version is present', () => {
      expect(shouldSuppressBanner(['node', 'nestify', '--version'])).toBe(true);
    });

    it('should suppress when -v is present', () => {
      expect(shouldSuppressBanner(['node', 'nestify', '-v'])).toBe(true);
    });

    it('should suppress when stdout is not a TTY', () => {
      Object.defineProperty(process.stdout, 'isTTY', {
        value: undefined,
        writable: true,
      });
      expect(shouldSuppressBanner(['node', 'nestify', 'new', 'app'])).toBe(
        true,
      );
    });

    it('should suppress when NESTIFY_NO_BANNER=1', () => {
      Object.defineProperty(process.stdout, 'isTTY', {
        value: true,
        writable: true,
      });
      process.env.NESTIFY_NO_BANNER = '1';
      expect(shouldSuppressBanner(['node', 'nestify', 'new', 'app'])).toBe(
        true,
      );
    });

    it('should not suppress for normal commands in TTY', () => {
      Object.defineProperty(process.stdout, 'isTTY', {
        value: true,
        writable: true,
      });
      delete process.env.NESTIFY_NO_BANNER;
      expect(shouldSuppressBanner(['node', 'nestify', 'new', 'app'])).toBe(
        false,
      );
    });

    it('should not suppress when NESTIFY_NO_BANNER is not "1"', () => {
      Object.defineProperty(process.stdout, 'isTTY', {
        value: true,
        writable: true,
      });
      process.env.NESTIFY_NO_BANNER = '0';
      expect(shouldSuppressBanner(['node', 'nestify', 'new', 'app'])).toBe(
        false,
      );
    });
  });

  describe('printBanner', () => {
    it('should print the banner to console', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      printBanner();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('nestify CLI'),
      );
      consoleSpy.mockRestore();
    });
  });
});
