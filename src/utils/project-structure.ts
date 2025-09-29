import fs from 'fs-extra';
import path from 'path';

function validatePath(basePath: string, relativePath: string): string {
  const resolvedPath = path.resolve(basePath, relativePath);
  if (!resolvedPath.startsWith(path.resolve(basePath))) {
    throw new Error('Path traversal detected');
  }
  return resolvedPath;
}

export function createProjectStructure(projectPath: string) {
  try {
    const directories = [
      'src',
      'src/common',
      'src/common/decorators',
      'src/common/exceptions',
      'src/common/enums',
      'src/common/filters',
      'src/common/guards',
      'src/common/interceptors',
      'src/common/pipes',
      'src/common/middleware',
      'src/config',
      'src/modules',
      'src/shared',
      'src/shared/services',
      'src/shared/utils',
      'test',
    ];

    directories.forEach((dir) => {
      try {
        const safePath = validatePath(projectPath, dir);
        fs.ensureDirSync(safePath);
      } catch (error) {
        throw new Error(`Failed to create directory ${dir}: ${error}`);
      }
    });

    // Create .gitkeep files to preserve empty directories
    const gitkeepDirs = [
      'src/common/decorators',
      'src/common/enums',
      'src/common/filters',
      'src/common/guards',
      'src/common/interceptors',
      'src/common/pipes',
      'src/common/middleware',
      'src/modules',
      'src/shared/services',
      'src/shared/utils',
    ];

    gitkeepDirs.forEach((dir) => {
      try {
        const safePath = validatePath(projectPath, path.join(dir, '.gitkeep'));
        fs.writeFileSync(safePath, '');
      } catch (error) {
        throw new Error(`Failed to create .gitkeep in ${dir}: ${error}`);
      }
    });
  } catch (error) {
    throw new Error(`Failed to create project structure: ${error}`);
  }
}
