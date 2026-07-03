import { Command } from 'commander';

export interface CommandDefinition {
  name: string;
  description: string;
  alias?: string;
  arguments: string;
  options?: Array<{
    flags: string;
    description: string;
    defaultValue?: string | boolean;
  }>;
  action: (...args: any[]) => void | Promise<void>;
}

/**
 * Command registry — add new commands here.
 * Each entry is loaded lazily to avoid importing all command modules upfront.
 */
export function getCommandDefinitions(): CommandDefinition[] {
  return [
    {
      name: 'new',
      arguments: '<project-name>',
      description: 'Create a new NestJS project',
      options: [
        {
          flags: '-p, --package-manager <manager>',
          description: 'Package manager to use',
          defaultValue: 'npm',
        },
        {
          flags: '--skip-install',
          description: 'Skip package installation',
          defaultValue: false,
        },
      ],
      action: (...args: any[]) => {
        const { newCommand } = require('../commands/new');
        return newCommand(...args);
      },
    },
    {
      name: 'generate',
      arguments: '<schematic> <name>',
      alias: 'g',
      description: 'Generate a new component (module, controller, service)',
      action: (...args: any[]) => {
        const { generateCommand } = require('../commands/generate');
        return generateCommand(...args);
      },
    },
  ];
}
