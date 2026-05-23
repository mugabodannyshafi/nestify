import { Command } from 'commander';
import { registerCommands } from '../register-commands';
import { CommandDefinition } from '../command-registry';

describe('registerCommands', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    program.exitOverride();
  });

  it('should register a command with name and description', () => {
    const definitions: CommandDefinition[] = [
      {
        name: 'test',
        arguments: '<arg>',
        description: 'A test command',
        action: jest.fn(),
      },
    ];

    registerCommands(program, definitions);

    const cmd = program.commands.find((c) => c.name() === 'test');
    expect(cmd).toBeDefined();
    expect(cmd?.description()).toBe('A test command');
  });

  it('should register a command with alias', () => {
    const definitions: CommandDefinition[] = [
      {
        name: 'generate',
        arguments: '<schematic> <name>',
        alias: 'g',
        description: 'Generate something',
        action: jest.fn(),
      },
    ];

    registerCommands(program, definitions);

    const cmd = program.commands.find((c) => c.name() === 'generate');
    expect(cmd).toBeDefined();
    expect(cmd?.alias()).toBe('g');
  });

  it('should register a command with options', () => {
    const definitions: CommandDefinition[] = [
      {
        name: 'new',
        arguments: '<name>',
        description: 'Create new project',
        options: [
          {
            flags: '--skip-install',
            description: 'Skip install',
            defaultValue: false,
          },
          {
            flags: '-p, --package-manager <pm>',
            description: 'Package manager',
            defaultValue: 'npm',
          },
        ],
        action: jest.fn(),
      },
    ];

    registerCommands(program, definitions);

    const cmd = program.commands.find((c) => c.name() === 'new');
    expect(cmd).toBeDefined();
    const opts = cmd?.options;
    expect(opts?.length).toBe(2);
  });

  it('should register multiple commands', () => {
    const definitions: CommandDefinition[] = [
      {
        name: 'new',
        arguments: '<name>',
        description: 'Create new',
        action: jest.fn(),
      },
      {
        name: 'generate',
        arguments: '<schematic> <name>',
        description: 'Generate',
        action: jest.fn(),
      },
    ];

    registerCommands(program, definitions);

    expect(program.commands).toHaveLength(2);
  });

  it('should register options without default value', () => {
    const definitions: CommandDefinition[] = [
      {
        name: 'test',
        arguments: '<arg>',
        description: 'Test',
        options: [
          {
            flags: '--verbose',
            description: 'Verbose output',
          },
        ],
        action: jest.fn(),
      },
    ];

    registerCommands(program, definitions);

    const cmd = program.commands.find((c) => c.name() === 'test');
    expect(cmd?.options?.length).toBe(1);
  });
});
