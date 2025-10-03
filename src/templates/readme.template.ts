// src/templates/readme.template.ts

export const createReadme = (
  projectName: string,
  description: string,
  packageManager: 'npm' | 'yarn' | 'pnpm',
  useDocker: boolean,
): string => {
  const installCommand =
    packageManager === 'yarn'
      ? 'yarn'
      : packageManager === 'pnpm'
        ? 'pnpm install'
        : 'npm install';

  const dockerSection = useDocker
    ? `### With Docker

\`\`\`bash
# Start with docker-compose
docker-compose up

# Start in detached mode
docker-compose up -d
\`\`\`

### Without Docker

`
    : '';

  return `# ${projectName}

${description}

## Installation

\`\`\`bash
${installCommand}
\`\`\`

## Running the app

${dockerSection}\`\`\`bash
# development
${packageManager} run start

# watch mode
${packageManager} run start:dev

# production mode
${packageManager} run start:prod
\`\`\`

## Test

\`\`\`bash
# unit tests
${packageManager} run test

# e2e tests
${packageManager} run test:e2e

# test coverage
${packageManager} run test:cov
\`\`\`

## CI/CD

This project includes GitHub Actions workflows for:
- Automated testing on push and pull requests
- Code quality checks (linting, formatting)
- Test coverage reporting

---
Generated with nestify 
`;
};
