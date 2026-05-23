import chalk from 'chalk';

const BANNER = `
╔════════════════════════════════╗
║        nestify CLI        ║
║   NestJS Project Generator     ║
╚════════════════════════════════╝
`;

/**
 * Determines whether the banner should be suppressed.
 *
 * Suppressed when:
 * - --help or -h is in argv
 * - --version or -v is in argv
 * - stdout is not a TTY (piping / scripting)
 * - NESTIFY_NO_BANNER=1 environment variable is set
 */
export function shouldSuppressBanner(argv: string[]): boolean {
  const flags = argv.slice(2);

  if (flags.includes('--help') || flags.includes('-h')) return true;
  if (flags.includes('--version') || flags.includes('-v')) return true;
  if (!process.stdout.isTTY) return true;
  if (process.env.NESTIFY_NO_BANNER === '1') return true;

  return false;
}

export function printBanner(): void {
  console.log(chalk.blue(BANNER));
}
