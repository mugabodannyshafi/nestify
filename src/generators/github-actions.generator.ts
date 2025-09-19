import { PackageManager } from '../constants/enums';

export class GitHubActionsGenerator {
  static generateTestWorkflow(packageManager: PackageManager): string {
    const installCommand = this.getInstallCommand(packageManager);
    const cacheKey =
      packageManager === PackageManager.NPM ? 'npm' : packageManager;

    return `name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - uses: actions/checkout@v3

    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: \${{ matrix.node-version }}
        cache: '${cacheKey}'

    - name: Install dependencies
      run: ${installCommand}

    - name: Run linter
      run: ${packageManager} run lint

    - name: Run unit tests
      run: ${packageManager} run test:cov

    - name: Run e2e tests
      run: ${packageManager} run test:e2e

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/coverage-final.json
        flags: unittests
        name: codecov-umbrella
        fail_ci_if_error: false

  build:
    runs-on: ubuntu-latest
    needs: test

    steps:
    - uses: actions/checkout@v3

    - name: Use Node.js 18.x
      uses: actions/setup-node@v3
      with:
        node-version: 18.x
        cache: '${cacheKey}'

    - name: Install dependencies
      run: ${installCommand}

    - name: Build application
      run: ${packageManager} run build

    - name: Check build output
      run: |
        if [ ! -d "dist" ]; then
          echo "Build failed: dist directory not found"
          exit 1
        fi`;
  }

  private static getInstallCommand(packageManager: PackageManager): string {
    switch (packageManager) {
      case PackageManager.YARN:
        return 'yarn --frozen-lockfile';
      case PackageManager.PNPM:
        return 'pnpm install --frozen-lockfile';
      default:
        return 'npm ci';
    }
  }
}
