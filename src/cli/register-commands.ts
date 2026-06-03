import { Command } from 'commander';
import { CommandDefinition } from './command-registry';

/**
 * Registers all command definitions onto the given Commander program.
 */
export function registerCommands(
  program: Command,
  definitions: CommandDefinition[],
): void {
  for (const def of definitions) {
    const cmd = program
      .command(`${def.name} ${def.arguments}`)
      .description(def.description);

    if (def.alias) {
      cmd.alias(def.alias);
    }

    if (def.options) {
      for (const opt of def.options) {
        if (opt.defaultValue !== undefined) {
          cmd.option(opt.flags, opt.description, opt.defaultValue);
        } else {
          cmd.option(opt.flags, opt.description);
        }
      }
    }

    cmd.action(def.action);
  }
}
