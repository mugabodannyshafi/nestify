# Nestify - Supercharged NestJS CLI

[![npm version](https://img.shields.io/npm/v/nestify-cli.svg)](https://www.npmjs.com/package/nestify-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/nestify-cli.svg)](https://nodejs.org)

> A powerful CLI tool for scaffolding production-ready NestJS projects with Docker, testing, and CI/CD setup out of the box.

## Documentation

For full documentation, visit [https://srt.rw/rT9RNP](https://srt.rw/rT9RNP)

## Installation

```bash
npm install -g nestify-cli
```

## Quick Start

```bash
nestify new my-awesome-app
```

Follow the interactive prompts to configure your project with:
- Package manager (npm/yarn/pnpm)
- Docker support (MySQL/PostgreSQL/MongoDB + Redis)
- Swagger documentation
- GitHub Actions CI/CD

## Project Structure

```
my-awesome-app/
├── src/                        # Application source code
│   ├── main.ts                 # Application entry point
│   ├── app.module.ts           # Root application module
│   ├── app.controller.ts       # Main controller with health checks
│   ├── app.controller.spec.ts  # Main controller unit tests
│   ├── app.service.ts          # Main service
│   ├── app.service.spec.ts     # Main service unit tests
│   ├── common/                 # Common utilities and shared code
│   │   ├── decorators/         # Custom decorators
│   │   ├── enums/              # Application enums
│   │   ├── exceptions/         # Custom exceptions
│   │   ├── filters/            # Exception filters
│   │   ├── guards/             # Route guards
│   │   ├── interceptors/       # Request/response interceptors
│   │   ├── middleware/         # Custom middleware
│   │   └── pipes/              # Validation pipes
│   ├── config/                 # Configuration files
│   ├── modules/                # Feature modules
│   └── shared/                 # Shared services and utilities
│       ├── services/           # Shared services
│       └── utils/              # Utility functions
├── test/                       # End-to-end tests
│   ├── app.e2e-spec.ts        # E2E test suite
│   └── jest-e2e.json          # E2E test configuration
├── .github/
│   └── workflows/
│       └── tests.yml          # CI/CD pipeline
├── .dockerignore              # Docker ignore rules
├── .env                       # Development environment variables
├── .env.example               # Example environment file
├── .env.testing               # Testing environment variables
├── .env.testing.example       # Example testing environment file
├── docker-compose.yml         # Docker services configuration
├── Dockerfile                 # Application container definition
├── package.json              # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── tsconfig.build.json      # TypeScript build configuration
├── eslint.config.mjs       # ESLint configuration
├── .prettierrc            # Prettier configuration
├── .gitignore            # Git ignore rules
└── README.md            # Project documentation
```

## Key Features

- **Production-ready NestJS setup** with best practices
- **Docker Compose** with database and Redis
- **ORM Support** with Prisma (CLI-based) or TypeORM
- **Testing** with Jest (unit & e2e)
- **CI/CD** with GitHub Actions
- **Code quality** with ESLint and Prettier
- **API documentation** with Swagger (optional)
- **Environment management** with .env files

## Database & ORM Support

### Prisma
Nestify uses the official Prisma CLI to initialize your database layer, ensuring you always get the latest features and best practices.

### TypeORM
Full TypeORM support with entity-based models for MySQL, PostgreSQL.

### Mongoose
MongoDB integration with Mongoose for schema-based modeling.

## License

MIT

## Author

**Shafi Danny MUGABO**  
[GitHub](https://github.com/mugabodannyshafi) | [NPM](https://www.npmjs.com/package/nestify-cli) | [Documentation](https://nestify-docs.vercel.app/)