#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { newCommand } from './commands/new';
import { generateCommand } from './commands/generate';
import pkg from '../package.json';

const program = new Command();

console.log(
  chalk.blue(`
╔════════════════════════════════╗
║        nestify CLI        ║
║   NestJS Project Generator     ║
╚════════════════════════════════╝
`),
);

program
  .name('nestify')
  .description('A powerful CLI tool for scaffolding NestJS applications')
  .version(pkg.version, '-v, --version', 'Show CLI version');

// Add the 'new' command
program
  .command('new <project-name>')
  .description('Create a new NestJS project')
  .option(
    '-p, --package-manager <manager>',
    'Package manager to use (npm, yarn, pnpm)',
    'npm',
  )
  .option('--skip-install', 'Skip package installation')
  .option('--dry-run', 'Preview project structure without creating files')
  .option('--no-git', 'Skip Git initialization')
  .addHelpText(
    'after',
    `
Examples:
  $ nestify new my-app
  $ nestify new my-app --package-manager yarn
  $ nestify new my-app --dry-run
  $ nestify new my-app --no-git
  $ nestify new my-app --skip-install

Note: Project names must:
  - Contain only lowercase letters, numbers, hyphens (-), and underscores (_)
  - Start and end with a letter or number
  - Not be a reserved JavaScript keyword (e.g., package, class, import)
`,
  )
  .action(newCommand);

// Add the 'generate' command (g for short)
program
  .command('generate <schematic> <name>')
  .alias('g')
  .description('Generate a new component (module, controller, service)')
  .action(generateCommand);

program.parse(process.argv);
