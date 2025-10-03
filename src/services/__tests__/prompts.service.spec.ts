import { PromptsService } from '../prompts.service';
import { PackageManager, Database } from '../../constants/enums';
import { ProjectAnswers } from '../../types/project.types';

jest.mock('inquirer');

import inquirer from 'inquirer';

describe('PromptsService', () => {
  let mockPrompt: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrompt = inquirer.prompt as unknown as jest.Mock;
  });

  describe('getProjectDetails', () => {
    it('should prompt user with all required questions', async () => {
      const mockAnswers: ProjectAnswers = {
        packageManager: PackageManager.NPM,
        description: 'Test app',
        author: 'Test Author',
        useDocker: false,
        useSwagger: false,
        useGraphQL: false,
        useGitHubActions: false,
      };

      mockPrompt.mockResolvedValue(mockAnswers);

      await PromptsService.getProjectDetails();

      expect(mockPrompt).toHaveBeenCalledTimes(1);
      expect(mockPrompt).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'list',
            name: 'packageManager',
            message: 'Which package manager would you like to use?',
          }),
          expect.objectContaining({
            type: 'input',
            name: 'description',
            message: 'Project description:',
          }),
          expect.objectContaining({
            type: 'input',
            name: 'author',
            message: 'Author:',
          }),
          expect.objectContaining({
            type: 'confirm',
            name: 'useDocker',
            message: 'Add Docker support?',
          }),
          expect.objectContaining({
            type: 'list',
            name: 'database',
            message: 'Which database would you like to use with Docker?',
          }),
        ]),
      );
    });

    it('should return project answers from inquirer', async () => {
      const mockAnswers: ProjectAnswers = {
        packageManager: PackageManager.YARN,
        description: 'My awesome app',
        author: 'John Doe',
        useDocker: true,
        database: Database.POSTGRES,
        useSwagger: false,
        useGraphQL: false,
        useGitHubActions: false,
      };

      mockPrompt.mockResolvedValue(mockAnswers);

      const result = await PromptsService.getProjectDetails();

      expect(result).toEqual(mockAnswers);
    });

    it('should use default package manager NPM when none provided', async () => {
      const mockAnswers: ProjectAnswers = {
        packageManager: PackageManager.NPM,
        description: 'Test',
        author: '',
        useDocker: false,
        useSwagger: false,
        useGraphQL: false,
        useGitHubActions: false,
      };

      mockPrompt.mockResolvedValue(mockAnswers);

      await PromptsService.getProjectDetails();

      const promptCall = mockPrompt.mock.calls[0][0];
      const packageManagerPrompt = promptCall.find(
        (q: any) => q.name === 'packageManager',
      );

      expect(packageManagerPrompt.default).toBe(PackageManager.NPM);
    });

    it('should use provided default package manager', async () => {
      const mockAnswers: ProjectAnswers = {
        packageManager: PackageManager.PNPM,
        description: 'Test',
        author: '',
        useDocker: false,
        useSwagger: false,
        useGraphQL: false,
        useGitHubActions: false,
      };

      mockPrompt.mockResolvedValue(mockAnswers);

      await PromptsService.getProjectDetails(PackageManager.PNPM);

      const promptCall = mockPrompt.mock.calls[0][0];
      const packageManagerPrompt = promptCall.find(
        (q: any) => q.name === 'packageManager',
      );

      expect(packageManagerPrompt.default).toBe(PackageManager.PNPM);
    });

    it('should include all package manager choices', async () => {
      const mockAnswers: ProjectAnswers = {
        packageManager: PackageManager.NPM,
        description: 'Test',
        author: '',
        useDocker: false,
        useSwagger: false,
        useGraphQL: false,
        useGitHubActions: false,
      };

      mockPrompt.mockResolvedValue(mockAnswers);

      await PromptsService.getProjectDetails();

      const promptCall = mockPrompt.mock.calls[0][0];
      const packageManagerPrompt = promptCall.find(
        (q: any) => q.name === 'packageManager',
      );

      expect(packageManagerPrompt.choices).toEqual(
        Object.values(PackageManager),
      );
    });

    it('should include all database choices', async () => {
      const mockAnswers: ProjectAnswers = {
        packageManager: PackageManager.NPM,
        description: 'Test',
        author: '',
        useDocker: false,
        useSwagger: false,
        useGraphQL: false,
        useGitHubActions: false,
      };

      mockPrompt.mockResolvedValue(mockAnswers);

      await PromptsService.getProjectDetails();

      const promptCall = mockPrompt.mock.calls[0][0];
      const databasePrompt = promptCall.find((q: any) => q.name === 'database');

      expect(databasePrompt.choices).toEqual(Object.values(Database));
    });

    it('should set default description to "A NestJS application"', async () => {
      const mockAnswers: ProjectAnswers = {
        packageManager: PackageManager.NPM,
        description: 'A NestJS application',
        author: '',
        useDocker: false,
        useSwagger: false,
        useGraphQL: false,
        useGitHubActions: false,
      };

      mockPrompt.mockResolvedValue(mockAnswers);

      await PromptsService.getProjectDetails();

      const promptCall = mockPrompt.mock.calls[0][0];
      const descriptionPrompt = promptCall.find(
        (q: any) => q.name === 'description',
      );

      expect(descriptionPrompt.default).toBe('A NestJS application');
    });

    it('should set default author to empty string', async () => {
      const mockAnswers: ProjectAnswers = {
        packageManager: PackageManager.NPM,
        description: 'Test',
        author: '',
        useDocker: false,
        useSwagger: false,
        useGraphQL: false,
        useGitHubActions: false,
      };

      mockPrompt.mockResolvedValue(mockAnswers);

      await PromptsService.getProjectDetails();

      const promptCall = mockPrompt.mock.calls[0][0];
      const authorPrompt = promptCall.find((q: any) => q.name === 'author');

      expect(authorPrompt.default).toBe('');
    });

    it('should set useDocker default to false', async () => {
      const mockAnswers: ProjectAnswers = {
        packageManager: PackageManager.NPM,
        description: 'Test',
        author: '',
        useDocker: false,
        useSwagger: false,
        useGraphQL: false,
        useGitHubActions: false,
      };

      mockPrompt.mockResolvedValue(mockAnswers);

      await PromptsService.getProjectDetails();

      const promptCall = mockPrompt.mock.calls[0][0];
      const dockerPrompt = promptCall.find((q: any) => q.name === 'useDocker');

      expect(dockerPrompt.default).toBe(false);
    });

    it('should set database default to MySQL', async () => {
      const mockAnswers: ProjectAnswers = {
        packageManager: PackageManager.NPM,
        description: 'Test',
        author: '',
        useDocker: false,
        useSwagger: false,
        useGraphQL: false,
        useGitHubActions: false,
      };

      mockPrompt.mockResolvedValue(mockAnswers);

      await PromptsService.getProjectDetails();

      const promptCall = mockPrompt.mock.calls[0][0];
      const databasePrompt = promptCall.find((q: any) => q.name === 'database');

      expect(databasePrompt.default).toBe(Database.MYSQL);
    });

    it('should only show database prompt when useDocker is true', async () => {
      const mockAnswers: ProjectAnswers = {
        packageManager: PackageManager.NPM,
        description: 'Test',
        author: '',
        useDocker: false,
        useSwagger: false,
        useGraphQL: false,
        useGitHubActions: false,
      };

      mockPrompt.mockResolvedValue(mockAnswers);

      await PromptsService.getProjectDetails();

      const promptCall = mockPrompt.mock.calls[0][0];
      const databasePrompt = promptCall.find((q: any) => q.name === 'database');

      expect(databasePrompt.when).toBeDefined();
      expect(databasePrompt.when({ useDocker: false })).toBe(false);
      expect(databasePrompt.when({ useDocker: true })).toBe(true);
    });

    it('should handle all package manager options', async () => {
      for (const pm of Object.values(PackageManager)) {
        const mockAnswers: ProjectAnswers = {
          packageManager: pm,
          description: 'Test',
          author: '',
          useDocker: false,
          useSwagger: false,
          useGraphQL: false,
          useGitHubActions: false,
        };

        mockPrompt.mockResolvedValue(mockAnswers);

        const result = await PromptsService.getProjectDetails();

        expect(result.packageManager).toBe(pm);
      }
    });

    it('should handle all database options', async () => {
      for (const db of Object.values(Database)) {
        const mockAnswers: ProjectAnswers = {
          packageManager: PackageManager.NPM,
          description: 'Test',
          author: '',
          useDocker: true,
          database: db,
          useSwagger: false,
          useGraphQL: false,
          useGitHubActions: false,
        };

        mockPrompt.mockResolvedValue(mockAnswers);

        const result = await PromptsService.getProjectDetails();

        expect(result.database).toBe(db);
      }
    });

    it('should handle Docker disabled scenario', async () => {
      const mockAnswers: ProjectAnswers = {
        packageManager: PackageManager.NPM,
        description: 'Test',
        author: '',
        useDocker: false,
        useSwagger: false,
        useGraphQL: false,
        useGitHubActions: false,
      };

      mockPrompt.mockResolvedValue(mockAnswers);

      const result = await PromptsService.getProjectDetails();

      expect(result.useDocker).toBe(false);
      expect(result.database).toBeUndefined();
    });

    it('should handle Docker enabled with database scenario', async () => {
      const mockAnswers: ProjectAnswers = {
        packageManager: PackageManager.NPM,
        description: 'Test',
        author: '',
        useDocker: true,
        database: Database.POSTGRES,
        useSwagger: false,
        useGraphQL: false,
        useGitHubActions: false,
      };

      mockPrompt.mockResolvedValue(mockAnswers);

      const result = await PromptsService.getProjectDetails();

      expect(result.useDocker).toBe(true);
      expect(result.database).toBe(Database.POSTGRES);
    });
  });
});
