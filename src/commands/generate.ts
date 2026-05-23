import chalk from 'chalk';
import { Schematic, SCHEMATIC_ALIASES } from '../constants/enums';
import { GenerateCommandOptions, GenerateConfig } from '../types/project.types';
import { GenerateService } from '../services/generate.service';

export async function generateCommand(
  schematic: string,
  name: string,
  options: GenerateCommandOptions,
) {
  const resolvedSchematic = SCHEMATIC_ALIASES[schematic.toLowerCase()];

  if (!resolvedSchematic) {
    console.log(chalk.red(`\n❌ Unknown schematic: "${schematic}"`));
    console.log(chalk.cyan('\nAvailable schematics:'));
    console.log(chalk.white('  module (mo)       - Generate a module'));
    console.log(chalk.white('  controller (co)   - Generate a controller'));
    console.log(chalk.white('  service (s)       - Generate a service'));
    console.log(chalk.white('  guard (gu)        - Generate a guard'));
    console.log(chalk.white('  interceptor (i)   - Generate an interceptor'));
    console.log(chalk.white('  pipe (p)          - Generate a pipe'));
    process.exit(1);
  }

  const config: GenerateConfig = {
    schematic: resolvedSchematic,
    name: name.toLowerCase(),
    options: {
      skipSpec: options.skipSpec || false,
      flat: options.flat || false,
      dryRun: options.dryRun || false,
    },
  };

  try {
    const files = GenerateService.generate(config);

    if (options.dryRun) {
      console.log(chalk.yellow('\n🏃 Dry run - no files written\n'));
      console.log(chalk.cyan('Files that would be created:'));
      for (const file of files) {
        console.log(chalk.white(`  CREATE ${file.filePath}`));
      }
    } else {
      console.log(
        chalk.green(`\n✅ Generated ${resolvedSchematic}: ${name}\n`),
      );
      for (const file of files) {
        console.log(chalk.white(`  CREATE ${file.filePath}`));
      }
    }
  } catch (error) {
    console.error(chalk.red(`\n❌ Failed to generate ${resolvedSchematic}`));
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
