import { GitHubActionsGenerator } from '../github-actions.generator';
import { PackageManager } from '../../constants/enums';

describe('GitHubActionsGenerator', () => {
  describe('generateTestWorkflow', () => {
    it('should generate workflow with npm commands', () => {
      const workflow = GitHubActionsGenerator.generateTestWorkflow(
        PackageManager.NPM,
      );

      expect(workflow).toContain('name: Tests');
      expect(workflow).toContain('npm ci');
      expect(workflow).toContain('npm run lint');
      expect(workflow).toContain('npm run test:cov');
      expect(workflow).toContain('npm run test:e2e');
      expect(workflow).toContain('npm run build');
      expect(workflow).toContain("cache: 'npm'");
    });

    it('should generate workflow with yarn commands', () => {
      const workflow = GitHubActionsGenerator.generateTestWorkflow(
        PackageManager.YARN,
      );

      expect(workflow).toContain('yarn --frozen-lockfile');
      expect(workflow).toContain('yarn run lint');
      expect(workflow).toContain('yarn run test:cov');
      expect(workflow).toContain('yarn run test:e2e');
      expect(workflow).toContain('yarn run build');
      expect(workflow).toContain("cache: 'yarn'");
    });

    it('should generate workflow with pnpm commands', () => {
      const workflow = GitHubActionsGenerator.generateTestWorkflow(
        PackageManager.PNPM,
      );

      expect(workflow).toContain('pnpm install --frozen-lockfile');
      expect(workflow).toContain('pnpm run lint');
      expect(workflow).toContain('pnpm run test:cov');
      expect(workflow).toContain('pnpm run test:e2e');
      expect(workflow).toContain('pnpm run build');
      expect(workflow).toContain("cache: 'pnpm'");
    });

    it('should include correct workflow triggers', () => {
      const workflow = GitHubActionsGenerator.generateTestWorkflow(
        PackageManager.NPM,
      );

      expect(workflow).toContain('on:');
      expect(workflow).toContain('push:');
      expect(workflow).toContain('branches: [ main, develop ]');
      expect(workflow).toContain('pull_request:');
    });

    it('should include test job with matrix strategy', () => {
      const workflow = GitHubActionsGenerator.generateTestWorkflow(
        PackageManager.NPM,
      );

      expect(workflow).toContain('jobs:');
      expect(workflow).toContain('test:');
      expect(workflow).toContain('runs-on: ubuntu-latest');
      expect(workflow).toContain('strategy:');
      expect(workflow).toContain('matrix:');
      expect(workflow).toContain('node-version: [18.x, 20.x]');
    });

    it('should include checkout and node setup steps', () => {
      const workflow = GitHubActionsGenerator.generateTestWorkflow(
        PackageManager.NPM,
      );

      expect(workflow).toContain('uses: actions/checkout@v3');
      expect(workflow).toContain('uses: actions/setup-node@v3');
      expect(workflow).toContain('node-version: ${{ matrix.node-version }}');
    });

    it('should include codecov upload step', () => {
      const workflow = GitHubActionsGenerator.generateTestWorkflow(
        PackageManager.NPM,
      );

      expect(workflow).toContain('Upload coverage to Codecov');
      expect(workflow).toContain('uses: codecov/codecov-action@v3');
      expect(workflow).toContain('file: ./coverage/coverage-final.json');
      expect(workflow).toContain('flags: unittests');
      expect(workflow).toContain('fail_ci_if_error: false');
    });

    it('should include build job that depends on test', () => {
      const workflow = GitHubActionsGenerator.generateTestWorkflow(
        PackageManager.NPM,
      );

      expect(workflow).toContain('build:');
      expect(workflow).toContain('needs: test');
      expect(workflow).toContain('Build application');
    });

    it('should include build verification step', () => {
      const workflow = GitHubActionsGenerator.generateTestWorkflow(
        PackageManager.NPM,
      );

      expect(workflow).toContain('Check build output');
      expect(workflow).toContain('if [ ! -d "dist" ]; then');
      expect(workflow).toContain('Build failed: dist directory not found');
      expect(workflow).toContain('exit 1');
    });

    it('should use Node 18.x for build job', () => {
      const workflow = GitHubActionsGenerator.generateTestWorkflow(
        PackageManager.NPM,
      );

      expect(workflow).toMatch(/build:[\s\S]*?node-version: 18\.x/);
    });
  });
});
