import fs from 'fs-extra';
import path from 'path';
import { Schematic } from '../constants/enums';
import { GenerateConfig } from '../types/project.types';
import {
  createModuleTemplate,
  createModuleSpecTemplate,
  createControllerTemplate,
  createControllerSpecTemplate,
  createServiceTemplate,
  createServiceSpecTemplate,
  createGuardTemplate,
  createGuardSpecTemplate,
  createInterceptorTemplate,
  createInterceptorSpecTemplate,
  createPipeTemplate,
  createPipeSpecTemplate,
} from '../templates/generate';

export interface GeneratedFile {
  filePath: string;
  content: string;
}

export class GenerateService {
  static generate(config: GenerateConfig): GeneratedFile[] {
    const files = this.buildFileList(config);

    if (config.options.dryRun) {
      return files;
    }

    for (const file of files) {
      fs.ensureDirSync(path.dirname(file.filePath));
      fs.writeFileSync(file.filePath, file.content);
    }

    // Auto-update parent module (skip for module schematic)
    if (config.schematic !== Schematic.MODULE) {
      this.updateParentModule(config);
    }

    return files;
  }

  static buildFileList(config: GenerateConfig): GeneratedFile[] {
    const { schematic, name, options } = config;
    const targetDir = this.resolveTargetDirectory(
      name,
      schematic,
      options.flat,
    );
    const files: GeneratedFile[] = [];

    const templateFn = this.getTemplateFn(schematic);
    const specTemplateFn = this.getSpecTemplateFn(schematic);
    const suffix = this.getSuffix(schematic);
    const baseName = this.getBaseName(name);

    // Main file
    files.push({
      filePath: path.join(targetDir, `${baseName}.${suffix}.ts`),
      content: templateFn(baseName),
    });

    // Spec file
    if (!options.skipSpec) {
      files.push({
        filePath: path.join(targetDir, `${baseName}.${suffix}.spec.ts`),
        content: specTemplateFn(baseName),
      });
    }

    return files;
  }

  static resolveTargetDirectory(
    name: string,
    schematic: Schematic,
    flat: boolean,
  ): string {
    const cwd = process.cwd();
    const baseName = this.getBaseName(name);

    // Check if we're inside a NestJS project (has src directory)
    const srcPath = path.join(cwd, 'src');
    const baseDir = fs.existsSync(srcPath) ? srcPath : cwd;

    if (flat) {
      return baseDir;
    }

    // Place in appropriate directory based on schematic type
    switch (schematic) {
      case Schematic.MODULE:
      case Schematic.CONTROLLER:
      case Schematic.SERVICE:
        return path.join(baseDir, baseName);
      case Schematic.GUARD:
        return path.join(baseDir, 'common', 'guards');
      case Schematic.INTERCEPTOR:
        return path.join(baseDir, 'common', 'interceptors');
      case Schematic.PIPE:
        return path.join(baseDir, 'common', 'pipes');
      default:
        return path.join(baseDir, baseName);
    }
  }

  static getBaseName(name: string): string {
    // Handle paths like "users/admin" -> "admin"
    return path.basename(name).toLowerCase();
  }

  static getSuffix(schematic: Schematic): string {
    switch (schematic) {
      case Schematic.MODULE:
        return 'module';
      case Schematic.CONTROLLER:
        return 'controller';
      case Schematic.SERVICE:
        return 'service';
      case Schematic.GUARD:
        return 'guard';
      case Schematic.INTERCEPTOR:
        return 'interceptor';
      case Schematic.PIPE:
        return 'pipe';
    }
  }

  static getTemplateFn(schematic: Schematic): (name: string) => string {
    switch (schematic) {
      case Schematic.MODULE:
        return createModuleTemplate;
      case Schematic.CONTROLLER:
        return createControllerTemplate;
      case Schematic.SERVICE:
        return createServiceTemplate;
      case Schematic.GUARD:
        return createGuardTemplate;
      case Schematic.INTERCEPTOR:
        return createInterceptorTemplate;
      case Schematic.PIPE:
        return createPipeTemplate;
    }
  }

  static getSpecTemplateFn(schematic: Schematic): (name: string) => string {
    switch (schematic) {
      case Schematic.MODULE:
        return createModuleSpecTemplate;
      case Schematic.CONTROLLER:
        return createControllerSpecTemplate;
      case Schematic.SERVICE:
        return createServiceSpecTemplate;
      case Schematic.GUARD:
        return createGuardSpecTemplate;
      case Schematic.INTERCEPTOR:
        return createInterceptorSpecTemplate;
      case Schematic.PIPE:
        return createPipeSpecTemplate;
    }
  }

  static updateParentModule(config: GenerateConfig): void {
    const { schematic, name } = config;
    const baseName = this.getBaseName(name);
    const className = this.toPascalCase(baseName);
    const suffix = this.getSuffix(schematic);
    const suffixPascal = suffix.charAt(0).toUpperCase() + suffix.slice(1);

    // Look for the nearest module file
    const modulePath = this.findNearestModule(config);
    if (!modulePath) return;

    let moduleContent = fs.readFileSync(modulePath, 'utf-8');

    // Build the import statement
    const componentClass = `${className}${suffixPascal}`;
    const relativePath = this.getRelativeImportPath(modulePath, config);

    const importStatement = `import { ${componentClass} } from '${relativePath}';`;

    // Add import at the top (after last import)
    const lastImportIndex = moduleContent.lastIndexOf('import ');
    const lastImportEnd = moduleContent.indexOf('\n', lastImportIndex);
    moduleContent =
      moduleContent.slice(0, lastImportEnd + 1) +
      importStatement +
      '\n' +
      moduleContent.slice(lastImportEnd + 1);

    // Add to the appropriate decorator array
    const arrayKey = this.getModuleArrayKey(schematic);
    moduleContent = this.addToModuleArray(
      moduleContent,
      arrayKey,
      componentClass,
    );

    fs.writeFileSync(modulePath, moduleContent);
  }

  static findNearestModule(config: GenerateConfig): string | null {
    const cwd = process.cwd();
    const srcPath = path.join(cwd, 'src');
    const baseName = this.getBaseName(config.name);

    // First check for a module in the same directory as the component
    const componentModulePath = path.join(
      srcPath,
      baseName,
      `${baseName}.module.ts`,
    );
    if (fs.existsSync(componentModulePath)) {
      return componentModulePath;
    }

    // Fall back to app.module.ts
    const appModulePath = path.join(srcPath, 'app.module.ts');
    if (fs.existsSync(appModulePath)) {
      return appModulePath;
    }

    return null;
  }

  static getRelativeImportPath(
    modulePath: string,
    config: GenerateConfig,
  ): string {
    const { schematic, name, options } = config;
    const baseName = this.getBaseName(name);
    const suffix = this.getSuffix(schematic);
    const targetDir = this.resolveTargetDirectory(
      name,
      schematic,
      options.flat,
    );
    const filePath = path.join(targetDir, `${baseName}.${suffix}`);

    let relativePath = path.relative(path.dirname(modulePath), filePath);

    // Ensure it starts with ./
    if (!relativePath.startsWith('.')) {
      relativePath = './' + relativePath;
    }

    // Normalize path separators for imports
    relativePath = relativePath.replace(/\\/g, '/');

    return relativePath;
  }

  static getModuleArrayKey(schematic: Schematic): string {
    switch (schematic) {
      case Schematic.CONTROLLER:
        return 'controllers';
      case Schematic.SERVICE:
      case Schematic.GUARD:
      case Schematic.INTERCEPTOR:
      case Schematic.PIPE:
        return 'providers';
      default:
        return 'providers';
    }
  }

  static addToModuleArray(
    content: string,
    arrayKey: string,
    className: string,
  ): string {
    // Match the array in the @Module decorator
    const arrayRegex = new RegExp(`(${arrayKey}:\\s*\\[)([^\\]]*)`, 's');
    const match = content.match(arrayRegex);

    if (match) {
      const existingItems = match[2].trim();
      if (existingItems) {
        // Add after existing items
        const replacement = `${match[1]}${existingItems}, ${className}`;
        content = content.replace(arrayRegex, replacement);
      } else {
        // Empty array
        const replacement = `${match[1]}${className}`;
        content = content.replace(arrayRegex, replacement);
      }
    } else {
      // Array key doesn't exist, add it before the closing of @Module
      const moduleDecoratorRegex = /@Module\(\{([^}]*)\}\)/s;
      const moduleMatch = content.match(moduleDecoratorRegex);
      if (moduleMatch) {
        const existingContent = moduleMatch[1].trimEnd();
        const newContent = `${existingContent}\n  ${arrayKey}: [${className}],\n`;
        content = content.replace(
          moduleDecoratorRegex,
          `@Module({${newContent}})`,
        );
      }
    }

    return content;
  }

  static toPascalCase(str: string): string {
    return str
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }
}
