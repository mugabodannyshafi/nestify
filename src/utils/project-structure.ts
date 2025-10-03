import fs from 'fs-extra';
import path from 'path';

export function createProjectStructure(projectPath: string) {
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
    'src/database',
    'src/database/entities',
    'src/database/seeders',
    'src/modules',
    'src/shared',
    'src/shared/services',
    'src/shared/utils',
    'test',
  ];

  directories.forEach((dir) => {
    fs.ensureDirSync(path.join(projectPath, dir));
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
    fs.writeFileSync(path.join(projectPath, dir, '.gitkeep'), '');
  });
}
