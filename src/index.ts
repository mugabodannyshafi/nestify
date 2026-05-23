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
  .option('-p, --package-manager <manager>', 'Package manager to use', 'npm')
  .option('--skip-install', 'Skip package installation')
  .action(newCommand);

// Add the 'generate' command (g for short)
program
  .command('generate <schematic> <name>')
  .alias('g')
  .description(
    'Generate a NestJS component (module|mo, controller|co, service|s, guard|gu, interceptor|i, pipe|p)',
  )
  .option('--skip-spec', 'Do not generate .spec.ts files', false)
  .option('--flat', 'Do not create a subdirectory for the component', false)
  .option(
    '--dry-run',
    'Preview files that would be created without writing',
    false,
  )
  .action(generateCommand);

program.parse(process.argv);
