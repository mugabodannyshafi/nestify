// src/templates/readme.template.ts

export const createReadme = (
  projectName: string,
  description: string,
  packageManager: 'npm' | 'yarn' | 'pnpm',
  useDocker: boolean,
  orm?: 'prisma' | 'typeorm',
): string => {
  const installCommand =
    packageManager === 'yarn'
      ? 'yarn'
      : packageManager === 'pnpm'
        ? 'pnpm install'
        : 'npm install';

  const prismaCommands =
    packageManager === 'yarn'
      ? {
          migrate: 'yarn prisma migrate dev',
          studio: 'yarn prisma studio',
          generate: 'yarn prisma generate',
          seed: 'yarn prisma db seed',
        }
      : packageManager === 'pnpm'
        ? {
            migrate: 'pnpm prisma migrate dev',
            studio: 'pnpm prisma studio',
            generate: 'pnpm prisma generate',
            seed: 'pnpm prisma db seed',
          }
        : {
            migrate: 'npx prisma migrate dev',
            studio: 'npx prisma studio',
            generate: 'npx prisma generate',
            seed: 'npx prisma db seed',
          };

  const prismaSection =
    orm === 'prisma'
      ? `
## Database (Prisma)

This project uses [Prisma](https://www.prisma.io/) as the ORM.

### Database Migrations

\`\`\`bash
# Create a new migration after modifying schema.prisma
${prismaCommands.migrate}

# Apply migrations
${prismaCommands.migrate}

# Reset database (⚠️ Development only - will delete all data)
${packageManager === 'yarn' ? 'yarn' : packageManager === 'pnpm' ? 'pnpm' : 'npx'} prisma migrate reset
\`\`\`

### Prisma Studio

Launch Prisma Studio to view and edit data in your database:

\`\`\`bash
${prismaCommands.studio}
\`\`\`

### Generate Prisma Client

After modifying your schema, regenerate the Prisma Client:

\`\`\`bash
${prismaCommands.generate}
\`\`\`

### Database Schema

The Prisma schema is located at \`prisma/schema.prisma\`. Modify it according to your needs and run migrations to apply changes.

`
      : '';

  const dockerSection = useDocker
    ? `### With Docker

\`\`\`bash
# Start with docker-compose
docker-compose up

# Start in detached mode
docker-compose up -d

${orm === 'prisma' ? `# Run migrations inside Docker container\ndocker-compose exec app ${prismaCommands.migrate}\n` : ''}\`\`\`

### Without Docker

`
    : '';

  return `# ${projectName}

${description}

## Installation

\`\`\`bash
${installCommand}
\`\`\`
${prismaSection}
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
