import { ProjectConfig } from '../types/project.types';

export class ConfigFilesGenerator {
  static generate(config: ProjectConfig): Record<string, string> {
    return {
      '.gitignore': this.getGitignore(),
      '.prettierrc': this.getPrettierConfig(),
      'eslint.config.mjs': this.getEslintConfig(),
    };
  }

  private static getGitignore(): string {
    return `# Dependencies
/dist
/node_modules
/build

# Environment
.env
.env.testing
.env.production

# IDE
.vscode/
.idea/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# OS
.DS_Store
Thumbs.db

# Tests
coverage/
.nyc_output/

# Temp files
*.tmp
*.swp
.pnpm-store`;
  }

  private static getPrettierConfig(): string {
    return JSON.stringify(
      {
        singleQuote: true,
        trailingComma: 'all',
        printWidth: 100,
        tabWidth: 2,
        semi: true,
        bracketSpacing: true,
        arrowParens: 'always',
        endOfLine: 'auto',
      },
      null,
      2,
    );
  }

  private static getEslintConfig(): string {
    return `// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', '.prettierrc', 'eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    plugins: {
      prettier: prettierPlugin,
    },
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_' 
      }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      
      // Prettier integration
      'prettier/prettier': ['error', {
        endOfLine: 'auto',
      }],
      
      // General rules
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    },
  },
);`;
  }
}
