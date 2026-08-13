# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Modular command registry and improved CLI bootstrap ([#66](https://github.com/mugabodannyshafi/nestify/pull/66))
- CLI input validation and `--dry-run` flag for the `new` command ([#64](https://github.com/mugabodannyshafi/nestify/pull/64))
- Git availability validation with helpful installation hints and a `--no-git` flag ([#53](https://github.com/mugabodannyshafi/nestify/pull/53))

### Changed

- Improved GitHub issue templates ([#49](https://github.com/mugabodannyshafi/nestify/pull/49))

## [1.6.1] - 2026-05-19

### Changed

- TypeScript configuration generation now includes `rootDir` and `ignoreDeprecations` options in `tsconfig.build.json` ([#39](https://github.com/mugabodannyshafi/nestify/pull/39))
- README updated with new links and removed the outdated project structure section ([#31](https://github.com/mugabodannyshafi/nestify/pull/31))

## [1.6.0] - 2025-10-20

### Added

- Authentication scaffolding with JWT support during project creation ([#28](https://github.com/mugabodannyshafi/nestify/pull/28))
  - JWT and local strategies, guards, auth and user modules, DTOs, and tests
  - Conditional Prisma `User` model generation
- Test file generation for the auth and user modules

### Changed

- `JWT_EXPIRATION` renamed to `JWT_EXPIRES_IN` across environment configurations
- CI workflows now also run on the `development` branch

## [1.5.0] - 2025-10-08

### Added

- Prisma ORM support, initialized through the official Prisma CLI ([#20](https://github.com/mugabodannyshafi/nestify/pull/20), [#21](https://github.com/mugabodannyshafi/nestify/pull/21))
- ORM support to the Docker Compose generator and related templates

## [1.4.3] - 2025-10-06

### Added

- Support for non-Docker database configurations ([#18](https://github.com/mugabodannyshafi/nestify/pull/18))

### Changed

- Database selection is now decoupled from Docker support in the interactive prompts
- `db`/`redis` hostnames are used with Docker; `localhost` is used for local setups

## [1.4.2] - 2025-10-03

### Changed

- Swagger and GitHub Actions are now always enabled in generated projects ([#15](https://github.com/mugabodannyshafi/nestify/pull/15))

### Removed

- `useSwagger` and `useGitHubActions` configuration options and their prompts

## [1.4.1] - 2025-10-03

### Changed

- Database-specific dependencies are now installed dynamically by `PackageInstallerService` based on the selected database instead of being hardcoded in templates ([#14](https://github.com/mugabodannyshafi/nestify/pull/14))

### Added

- `@nestjs/config` as a default dependency

## [1.4.0] - 2025-10-03

### Added

- Database module generation with TypeORM/Mongoose connection setup ([#13](https://github.com/mugabodannyshafi/nestify/pull/13))

## [1.3.0] - 2025-10-03

### Changed

- Dependencies are now installed via explicit package lists, with regular and dev dependencies installed separately ([#12](https://github.com/mugabodannyshafi/nestify/pull/12))

## [1.2.0] - 2025-10-01

### Added

- CLI version is now read dynamically from `package.json` instead of being hardcoded ([#10](https://github.com/mugabodannyshafi/nestify/pull/10))
- `-v, --version` flag with descriptive help text

## [1.1.0] - 2025-09-30

### Added

- Automatic code formatting of generated projects through `FormatterService` ([#9](https://github.com/mugabodannyshafi/nestify/pull/9))
- Jest testing framework with coverage and watch modes ([#8](https://github.com/mugabodannyshafi/nestify/pull/8))
- Unit tests for the `generate` and `new` commands

## [1.0.1] - 2025-09-29

### Changed

- Patch version bump with no user-facing changes

## [1.0.0] - 2025-09-29

### Changed

- **Breaking:** package renamed from `@mugabodannyshafi/nestify` to `nestify-cli` ([#7](https://github.com/mugabodannyshafi/nestify/pull/7))
- Enhanced Prettier configuration and added a `format` script ([#6](https://github.com/mugabodannyshafi/nestify/pull/6))

### Added

- CLI help and version checks to the CI test workflow

## [0.0.6] - 2025-09-25

### Changed

- Simplified the README and updated the documentation link ([#3](https://github.com/mugabodannyshafi/nestify/pull/3), [#4](https://github.com/mugabodannyshafi/nestify/pull/4))

## [0.0.5] - 2025-09-23

### Added

- Git repository initialization for new projects
- Database selection and GitHub Actions support in the `new` command
- Test files and an expanded project structure

### Changed

- Renamed the project from `nestForge` to `nestify`

## [0.0.3] - 2025-09-19

### Added

- Initial release with NestJS project scaffolding
- ESLint configuration and package metadata

[Unreleased]: https://github.com/mugabodannyshafi/nestify/compare/v1.6.1...HEAD
[1.6.1]: https://github.com/mugabodannyshafi/nestify/compare/v1.6.0...v1.6.1
[1.6.0]: https://github.com/mugabodannyshafi/nestify/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/mugabodannyshafi/nestify/compare/v1.4.3...v1.5.0
[1.4.3]: https://github.com/mugabodannyshafi/nestify/compare/v1.4.2...v1.4.3
[1.4.2]: https://github.com/mugabodannyshafi/nestify/compare/v1.4.1...v1.4.2
[1.4.1]: https://github.com/mugabodannyshafi/nestify/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/mugabodannyshafi/nestify/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/mugabodannyshafi/nestify/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/mugabodannyshafi/nestify/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/mugabodannyshafi/nestify/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/mugabodannyshafi/nestify/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/mugabodannyshafi/nestify/compare/v0.0.6...v1.0.0
[0.0.6]: https://github.com/mugabodannyshafi/nestify/compare/v0.0.5...v0.0.6
[0.0.5]: https://github.com/mugabodannyshafi/nestify/compare/v0.0.3...v0.0.5
[0.0.3]: https://github.com/mugabodannyshafi/nestify/releases/tag/v0.0.3
