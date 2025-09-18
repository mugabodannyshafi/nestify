import chalk from 'chalk';

export async function generateCommand(schematic: string, name: string) {
  console.log(chalk.yellow(`⚠️  Generate command coming soon!`));
  console.log(chalk.cyan(`Will generate: ${schematic} named ${name}`));
  console.log(chalk.gray('This feature is under development...'));
}
