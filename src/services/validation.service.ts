import { PackageManager, Database, ORM } from '../constants/enums';

/**
 * Validation error type
 */
export interface ValidationError {
  field: string;
  message: string;
  suggestion?: string;
}

/**
 * Service for validating CLI inputs and user choices
 */
export class ValidationService {
  /**
   * Reserved JavaScript and npm keywords that should not be used as project names
   */
  private static readonly RESERVED_KEYWORDS = [
    'package',
    'name',
    'version',
    'description',
    'main',
    'bin',
    'scripts',
    'dependencies',
    'devDependencies',
    'default',
    'null',
    'undefined',
    'true',
    'false',
    'class',
    'const',
    'let',
    'var',
    'function',
    'async',
    'await',
    'import',
    'export',
    'from',
    'as',
    'return',
    'if',
    'else',
    'for',
    'while',
    'do',
    'break',
    'continue',
    'switch',
    'case',
    'default',
    'try',
    'catch',
    'finally',
    'throw',
    'new',
    'this',
    'super',
    'extends',
    'implements',
    'interface',
    'type',
    'enum',
    'namespace',
    'module',
    'static',
    'public',
    'private',
    'protected',
    'readonly',
    'abstract',
    'yield',
    'instanceof',
    'in',
    'of',
    'delete',
    'typeof',
    'void',
    'with',
  ];

  /**
   * Validates a project name according to npm package naming rules
   * @param projectName The project name to validate
   * @returns Array of validation errors, empty if valid
   */
  static validateProjectName(projectName: string): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for empty name
    if (!projectName || projectName.trim().length === 0) {
      errors.push({
        field: 'projectName',
        message: 'Project name cannot be empty.',
        suggestion: 'Provide a non-empty project name.',
      });
      return errors;
    }

    const trimmedName = projectName.trim();

    // Check for length
    if (trimmedName.length > 214) {
      errors.push({
        field: 'projectName',
        message: 'Project name is too long (max 214 characters).',
        suggestion: `Use a shorter name. Current: ${trimmedName.length} characters.`,
      });
    }

    // Check for invalid characters (npm package naming rules)
    const validNamePattern = /^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$/;
    if (!validNamePattern.test(trimmedName)) {
      errors.push({
        field: 'projectName',
        message:
          'Project name contains invalid characters. npm package names must contain only lowercase letters, numbers, hyphens, underscores, and dots.',
        suggestion:
          'Use only lowercase letters, numbers, hyphens (-), underscores (_), and dots (.). ' +
          'Start and end with a letter or number.',
      });
    }

    // Check for reserved keywords
    if (this.RESERVED_KEYWORDS.includes(trimmedName.toLowerCase())) {
      errors.push({
        field: 'projectName',
        message: `"${trimmedName}" is a reserved JavaScript keyword and cannot be used as a project name.`,
        suggestion: `Try a different name like "${trimmedName}-app" or "my-${trimmedName}".`,
      });
    }

    return errors;
  }

  /**
   * Validates package manager choice
   * @param packageManager The package manager choice to validate
   * @returns Array of validation errors, empty if valid
   */
  static validatePackageManager(packageManager: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (
      !packageManager ||
      !Object.values(PackageManager).includes(packageManager as PackageManager)
    ) {
      errors.push({
        field: 'packageManager',
        message: `"${packageManager}" is not a valid package manager.`,
        suggestion: `Valid options are: ${Object.values(PackageManager).join(', ')}`,
      });
    }

    return errors;
  }

  /**
   * Validates database choice
   * @param database The database choice to validate
   * @returns Array of validation errors, empty if valid
   */
  static validateDatabase(database: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!database || !Object.values(Database).includes(database as Database)) {
      errors.push({
        field: 'database',
        message: `"${database}" is not a valid database option.`,
        suggestion: `Valid options are: ${Object.values(Database).join(', ')}`,
      });
    }

    return errors;
  }

  /**
   * Validates ORM choice for a given database
   * @param orm The ORM choice to validate
   * @param database The selected database (for compatibility check)
   * @returns Array of validation errors, empty if valid
   */
  static validateORM(orm: string, database: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!orm || !Object.values(ORM).includes(orm as ORM)) {
      errors.push({
        field: 'orm',
        message: `"${orm}" is not a valid ORM option.`,
        suggestion: `Valid options are: ${Object.values(ORM).join(', ')}`,
      });
      return errors;
    }

    // Check ORM compatibility with database
    const ormDatabaseCompatibility: Record<string, string[]> = {
      [ORM.TYPEORM]: [Database.MYSQL, Database.POSTGRES],
      [ORM.PRISMA]: [Database.MYSQL, Database.POSTGRES],
    };

    const validDatabases = ormDatabaseCompatibility[orm] || [];
    if (!validDatabases.includes(database as Database)) {
      errors.push({
        field: 'orm',
        message: `"${orm}" is not compatible with "${database}" database.`,
        suggestion: `For ${database}, valid ORMs are: ${validDatabases.join(', ') || 'None'}`,
      });
    }

    return errors;
  }

  /**
   * Validates authentication strategy choices
   * @param strategies Array of selected authentication strategies
   * @returns Array of validation errors, empty if valid
   */
  static validateAuthStrategies(strategies: string[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const validStrategies = ['jwt'];

    if (!Array.isArray(strategies) || strategies.length === 0) {
      errors.push({
        field: 'authStrategies',
        message: 'At least one authentication strategy must be selected.',
        suggestion: `Valid options are: ${validStrategies.join(', ')}`,
      });
      return errors;
    }

    const invalidStrategies = strategies.filter(
      (s) => !validStrategies.includes(s.toLowerCase()),
    );
    if (invalidStrategies.length > 0) {
      errors.push({
        field: 'authStrategies',
        message: `Invalid authentication strategies: ${invalidStrategies.join(', ')}`,
        suggestion: `Valid options are: ${validStrategies.join(', ')}`,
      });
    }

    return errors;
  }

  /**
   * Validates all CLI command options
   * @param projectName The project name
   * @param packageManager The package manager choice
   * @param database The database choice
   * @param orm The ORM choice
   * @returns Combined array of all validation errors
   */
  static validateAll(
    projectName: string,
    packageManager: string,
    database?: string,
    orm?: string,
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    errors.push(...this.validateProjectName(projectName));
    errors.push(...this.validatePackageManager(packageManager));

    if (database) {
      errors.push(...this.validateDatabase(database));
      if (orm) {
        errors.push(...this.validateORM(orm, database));
      }
    }

    return errors;
  }

  /**
   * Formats validation errors for console output
   * @param errors Array of validation errors
   * @returns Formatted error message
   */
  static formatErrors(errors: ValidationError[]): string {
    if (errors.length === 0) {
      return '';
    }

    let output = '\n❌ Validation failed:\n';
    errors.forEach((error, index) => {
      output += `\n${index + 1}. ${error.message}`;
      if (error.suggestion) {
        output += `\n   💡 ${error.suggestion}`;
      }
    });
    output += '\n';

    return output;
  }
}
