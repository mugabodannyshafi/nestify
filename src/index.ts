#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { newCommand } from './commands/new';
import { generateCommand } from './commands/generate';

const program = new Command();

console.log(
  chalk.blue(`
╔════════════════════════════════╗
║      🔨 nestify CLI 🔨      ║
║   NestJS Project Generator     ║
╚════════════════════════════════╝
`),
);

program
  .name('nestify')
  .description('A powerful CLI tool for scaffolding NestJS applications')
  .version('0.0.1');

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
  .description('Generate a new component (module, controller, service)')
  .action(generateCommand);

program.parse(process.argv);
