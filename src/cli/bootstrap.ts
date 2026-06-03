import { Command } from 'commander';
import chalk from 'chalk';
import { shouldSuppressBanner, printBanner } from './banner';
import { getCommandDefinitions } from './command-registry';
import { registerCommands } from './register-commands';
import pkg from '../../package.json';

/**
 * Bootstraps the CLI application:
 * - Conditionally prints the banner
 * - Configures the root program with --verbose
 * - Registers all commands from the registry
 * - Installs global error handlers
 * - Parses argv
 */
export function bootstrap(argv: string[] = process.argv): void {
  installGlobalErrorHandlers();

  if (!shouldSuppressBanner(argv)) {
    printBanner();
  }

  const program = new Command();

  program
    .name('nestify')
    .description('A powerful CLI tool for scaffolding NestJS applications')
    .version(pkg.version, '-v, --version', 'Show CLI version')
    .option('--verbose', 'Enable verbose output', false);

  const definitions = getCommandDefinitions();
  registerCommands(program, definitions);

  program.parse(argv);
}

function installGlobalErrorHandlers(): void {
  process.on('unhandledRejection', (reason: unknown) => {
    console.error(
      chalk.red('\n❌ Unhandled error:'),
      reason instanceof Error ? reason.message : reason,
    );
    if (
      process.env.NESTIFY_VERBOSE === '1' &&
      reason instanceof Error &&
      reason.stack
    ) {
      console.error(chalk.gray(reason.stack));
    }
    process.exit(1);
  });

  process.on('uncaughtException', (error: Error) => {
    console.error(chalk.red('\n❌ Unexpected error:'), error.message);
    if (process.env.NESTIFY_VERBOSE === '1' && error.stack) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  });
}
