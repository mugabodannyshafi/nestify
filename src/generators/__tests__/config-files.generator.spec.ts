import { NewCommandOptions } from '../../types/project.types';
import { ProjectConfig } from '../../types/project.types';
import { ProjectAnswers } from '../../types/project.types';
import { PackageManager, Database } from '../../constants/enums';

describe('Project Types', () => {
  describe('ProjectAnswers', () => {
    it('should create a valid ProjectAnswers object', () => {
      const answers: ProjectAnswers = {
        packageManager: PackageManager.NPM,
        description: 'Test project',
        author: 'Test Author',
        useDocker: true,
        database: Database.POSTGRES,
      };

      expect(answers.packageManager).toBe(PackageManager.NPM);
      expect(answers.description).toBe('Test project');
      expect(answers.author).toBe('Test Author');
      expect(answers.useDocker).toBe(true);
      expect(answers.database).toBe(Database.POSTGRES);
    });

    it('should allow optional database field', () => {
      const answers: ProjectAnswers = {
        packageManager: PackageManager.YARN,
        description: 'Test',
        author: 'Author',
        useDocker: false,
      };

      expect(answers.database).toBeUndefined();
    });
  });

  describe('NewCommandOptions', () => {
    it('should create a valid NewCommandOptions object', () => {
      const options: NewCommandOptions = {
        packageManager: 'npm',
        skipInstall: true,
      };

      expect(options.packageManager).toBe('npm');
      expect(options.skipInstall).toBe(true);
    });
  });

  describe('ProjectConfig', () => {
    it('should create a valid ProjectConfig object', () => {
      const config: ProjectConfig = {
        name: 'my-app',
        path: '/path/to/project',
        answers: {
          packageManager: PackageManager.PNPM,
          description: 'My awesome app',
          author: 'Developer',
          useDocker: true,
          database: Database.MONGODB,
        },
      };

      expect(config.name).toBe('my-app');
      expect(config.path).toBe('/path/to/project');
      expect(config.answers.packageManager).toBe(PackageManager.PNPM);
      expect(config.answers.database).toBe(Database.MONGODB);
    });
  });
});
