import { shouldSuppressBanner, printBanner } from '../banner';
import { getCommandDefinitions } from '../command-registry';
import { registerCommands } from '../register-commands';

jest.mock('chalk', () => ({
  red: jest.fn((str: string) => str),
  blue: jest.fn((str: string) => str),
  gray: jest.fn((str: string) => str),
}));

jest.mock('../banner');
jest.mock('../command-registry');
jest.mock('../register-commands');

// Mock commander to avoid actual parsing side effects
jest.mock('commander', () => {
  const mockCmd = {
    name: jest.fn().mockReturnThis(),
    description: jest.fn().mockReturnThis(),
    version: jest.fn().mockReturnThis(),
    option: jest.fn().mockReturnThis(),
    parse: jest.fn().mockReturnThis(),
  };
  return { Command: jest.fn(() => mockCmd) };
});

describe('bootstrap', () => {
  let mockShouldSuppress: jest.Mock;
  let mockPrintBanner: jest.Mock;
  let mockGetDefinitions: jest.Mock;
  let mockRegisterCommands: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockShouldSuppress = shouldSuppressBanner as jest.Mock;
    mockPrintBanner = printBanner as jest.Mock;
    mockGetDefinitions = getCommandDefinitions as jest.Mock;
    mockRegisterCommands = registerCommands as jest.Mock;

    mockGetDefinitions.mockReturnValue([]);
    mockRegisterCommands.mockImplementation(() => {});
  });

  it('should print banner when not suppressed', () => {
    mockShouldSuppress.mockReturnValue(false);

    const { bootstrap } = require('../bootstrap');
    bootstrap(['node', 'nestify', 'new', 'app']);

    expect(mockPrintBanner).toHaveBeenCalled();
  });

  it('should not print banner when suppressed', () => {
    mockShouldSuppress.mockReturnValue(true);

    const { bootstrap } = require('../bootstrap');
    bootstrap(['node', 'nestify', '--help']);

    expect(mockPrintBanner).not.toHaveBeenCalled();
  });

  it('should register commands from the registry', () => {
    mockShouldSuppress.mockReturnValue(true);
    const mockDefs = [
      {
        name: 'test',
        arguments: '<a>',
        description: 'x',
        action: jest.fn(),
      },
    ];
    mockGetDefinitions.mockReturnValue(mockDefs);

    const { bootstrap } = require('../bootstrap');
    bootstrap(['node', 'nestify', '--help']);

    expect(mockRegisterCommands).toHaveBeenCalledWith(
      expect.anything(),
      mockDefs,
    );
  });

  it('should call parse with provided argv', () => {
    mockShouldSuppress.mockReturnValue(true);

    const { bootstrap } = require('../bootstrap');
    const { Command } = require('commander');
    const mockInstance = new Command();

    bootstrap(['node', 'nestify', 'new', 'app']);

    expect(mockInstance.parse).toHaveBeenCalledWith([
      'node',
      'nestify',
      'new',
      'app',
    ]);
  });
});
