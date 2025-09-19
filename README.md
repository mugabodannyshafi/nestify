# 🚀 Nestify - Supercharged NestJS CLI

[![npm version](https://img.shields.io/npm/v/@mugabodannyshafi/nestify.svg)](https://www.npmjs.com/package/@mugabodannyshafi/nestify)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@mugabodannyshafi/nestify.svg)](https://nodejs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/mugabodannyshafi/nestify/pulls)

> A powerful, production-ready CLI tool for scaffolding NestJS projects with best practices, Docker support, and complete development environment setup out of the box.

Nestify is an enhanced alternative to the standard NestJS CLI, designed to accelerate your development workflow by generating production-ready NestJS projects with pre-configured Docker environments, testing setups, CI/CD pipelines, and more.

## ✨ Features

### 🎯 Core Features
- **Production-Ready Scaffolding** - Generate complete NestJS projects with best practices and proper folder structure
- **Multiple Package Managers** - Support for npm, yarn, and pnpm
- **Environment Management** - Auto-generated `.env` files for development and testing environments
- **TypeScript Configuration** - Pre-configured TypeScript with path aliases and optimal settings
- **Testing Setup** - Unit tests, e2e tests, and coverage configuration out of the box
- **Code Quality** - ESLint and Prettier pre-configured with modern standards
- **API Documentation** - Optional Swagger/OpenAPI integration

### 🐳 Docker Support
- **Docker Compose** - Complete multi-service Docker setup
- **Multiple Databases** - Choose between MySQL, PostgreSQL, or MongoDB
- **Redis Integration** - Included Redis service for caching/sessions
- **Health Checks** - Proper health check configuration for all services
- **Separate Test Environments** - Isolated database and Redis instances for testing

### 🔄 CI/CD Integration
- **GitHub Actions** - Pre-configured workflows for automated testing
- **Multi-Node Testing** - Test against multiple Node.js versions
- **Code Coverage** - Integrated coverage reporting with Codecov support
- **Build Verification** - Automated build checks

### 🛠️ Developer Experience
- **Hot Reload** - Development server with automatic restart on changes
- **Git Ready** - Initialized Git repository with all files staged
- **Comprehensive .gitignore** - Properly configured to exclude unnecessary files
- **Clear Documentation** - Auto-generated README with project-specific instructions

## 📦 Installation

Install globally using your preferred package manager:

```bash
# Using npm
npm install -g @mugabodannyshafi/nestify

# Using yarn
yarn global add @mugabodannyshafi/nestify

# Using pnpm
pnpm add -g @mugabodannyshafi/nestify
```

## 🚀 Quick Start

### Create a New Project

```bash
nestify new my-awesome-app
```

You'll be prompted with an interactive setup to configure your project:

```
? Which package manager would you like to use? (npm/yarn/pnpm)
? Project description: A NestJS application
? Author: John Doe
? Add Docker support? Yes
? Which database would you like to use with Docker? (mysql/postgres/mongodb)
? Add Swagger documentation? Yes
? Add GitHub Actions for CI/CD? Yes
```

### Project Structure

Nestify generates a well-organized project structure:

```
my-awesome-app/
├── src/
│   ├── main.ts                 # Application entry point
│   ├── app.module.ts           # Root application module
│   ├── app.controller.ts       # Main controller with health checks
│   ├── app.service.ts          # Main service
│   └── *.spec.ts              # Unit tests
├── test/
│   ├── app.e2e-spec.ts        # E2E tests
│   └── jest-e2e.json          # E2E test configuration
├── .github/
│   └── workflows/
│       └── tests.yml          # CI/CD pipeline
├── .env                       # Development environment variables
├── .env.example              # Example environment file
├── .env.testing              # Testing environment variables
├── docker-compose.yml        # Docker services configuration
├── Dockerfile               # Application container definition
├── package.json            # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── eslint.config.mjs     # ESLint configuration
├── .prettierrc          # Prettier configuration
└── README.md           # Project documentation
```

## 🐳 Docker Configuration

When Docker support is enabled, Nestify configures a complete development environment:

### Services Included
- **app** - Your NestJS application
- **db** - Primary database (MySQL/PostgreSQL/MongoDB)
- **db-test** - Separate test database
- **redis** - Redis for caching/sessions
- **redis-test** - Separate Redis instance for testing

### Starting with Docker

```bash
# Start all services
docker-compose up

# Start in detached mode
docker-compose up -d

# Stop all services
docker-compose down
```

### Database Configurations

#### MySQL Configuration
- Port forwarding: 3307 (avoids conflicts with local MySQL)
- Automatic database creation
- Health checks configured
- Root and application users set up

#### PostgreSQL Configuration
- Port forwarding: 5433 (avoids conflicts with local PostgreSQL)
- Automatic database initialization
- Health checks with pg_isready
- Configured for optimal development

#### MongoDB Configuration
- Port forwarding: 27018 (avoids conflicts with local MongoDB)
- Authentication configured
- Replica set ready
- Connection string provided in .env

## 🧪 Testing

Nestify projects come with a complete testing setup:

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:cov

# Run e2e tests
npm run test:e2e
```

### Test Environment
- Separate `.env.testing` file for test configuration
- Isolated test databases
- Configured test runners (Jest)
- Coverage reporting setup

## 📚 API Documentation

When Swagger is enabled, your API documentation is automatically available at:

```
http://localhost:3000/api
```

Features include:
- Interactive API explorer
- Request/Response schemas
- Authentication support
- Auto-generated from decorators

## 🔄 CI/CD Pipeline

The generated GitHub Actions workflow includes:

- **Multi-version testing** - Tests against Node.js 18.x and 20.x
- **Dependency caching** - Faster CI runs with cached dependencies
- **Linting** - Code quality checks
- **Unit tests** - With coverage reporting
- **E2E tests** - Full application testing
- **Build verification** - Ensures production build works

## 📝 Environment Variables

Nestify generates comprehensive environment configuration:

### Development (.env)
```env
# Application
APP_NAME=my-awesome-app
APP_PORT=3000
NODE_ENV=development

# Database
DB_TYPE=postgres
DB_HOST=db
DB_PORT=5432
DB_DATABASE=my_awesome_app
DB_USERNAME=app_user
DB_PASSWORD=app_password_123

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRATION=7d

# API
API_PREFIX=api
API_VERSION=1
```

### Testing (.env.testing)
Separate configuration for isolated testing environment with dedicated database and Redis instances.

## 🛠️ Commands Reference

### Create New Project
```bash
nestify new <project-name> [options]

Options:
  --skip-install       Skip package installation
  --package-manager    Specify package manager (npm/yarn/pnpm)
```

### Future Commands (Roadmap)
- `nestify generate module <name>` - Generate a new module
- `nestify generate controller <name>` - Generate a new controller
- `nestify generate service <name>` - Generate a new service
- `nestify add auth` - Add authentication boilerplate
- `nestify add database` - Add database configuration

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ☕ Support

If you find this tool helpful, consider buying me a coffee:

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-☕-yellow.svg)](https://buymeacoffee.com/mugabodannf)

## 🙏 Acknowledgments

- Built for the amazing [NestJS](https://nestjs.com/) community
- Inspired by modern development workflows and best practices
- Thanks to all contributors who help make this tool better

## 🚧 Roadmap

- [ ] Add authentication scaffolding (JWT, OAuth)
- [ ] Support for microservices architecture
- [ ] GraphQL scaffolding option
- [ ] WebSocket support
- [ ] Database migration setup
- [ ] Kubernetes configuration generation
- [ ] Monorepo support
- [ ] Custom template system
- [ ] Plugin architecture
- [ ] Interactive UI mode

## 📮 Contact

- **Author**: Shafi Danny MUGABO
- **Email**: mugabodannyshafi@gmail.com
- **GitHub**: [@mugabodannyshafi](https://github.com/mugabodannyshafi)

---

<p align="center">
  Made by Shafi Danny MUGABO
</p>

<p align="center">
  <a href="https://nestjs.com/">NestJS</a> •
  <a href="https://github.com/mugabodannyshafi/nestify">GitHub</a> •
  <a href="https://www.npmjs.com/package/@mugabodannyshafi/nestify">NPM</a>
</p>