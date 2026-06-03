import { ValidationService, ValidationError } from '../validation.service';
import { Database, ORM, PackageManager } from '../../constants/enums';

describe('ValidationService', () => {
  describe('validateProjectName', () => {
    it('should accept valid project names', () => {
      const validNames = [
        'my-app',
        'my_app',
        'myapp',
        'my-app-123',
        'app.test',
        'my-awesome-nest-app',
      ];

      validNames.forEach((name) => {
        const errors = ValidationService.validateProjectName(name);
        expect(errors).toEqual([]);
      });
    });

    it('should reject empty project names', () => {
      const errors = ValidationService.validateProjectName('');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].field).toBe('projectName');
      expect(errors[0].message).toContain('cannot be empty');
    });

    it('should reject whitespace-only project names', () => {
      const errors = ValidationService.validateProjectName('   ');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('cannot be empty');
    });

    it('should reject project names with invalid characters', () => {
      const invalidNames = [
        'my-app!',
        'my app',
        'my@app',
        'my#app',
        'MyApp',
        'my-APP',
      ];

      invalidNames.forEach((name) => {
        const errors = ValidationService.validateProjectName(name);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((e) => e.field === 'projectName')).toBe(true);
      });
    });

    it('should reject reserved JavaScript keywords', () => {
      const reservedKeywords = ['package', 'class', 'const', 'function'];

      reservedKeywords.forEach((keyword) => {
        const errors = ValidationService.validateProjectName(keyword);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].message).toContain('reserved');
      });
    });

    it('should reject names starting or ending with hyphens', () => {
      const invalidNames = ['-my-app', 'my-app-', '_my-app', 'my-app_'];

      invalidNames.forEach((name) => {
        const errors = ValidationService.validateProjectName(name);
        expect(errors.length).toBeGreaterThan(0);
      });
    });

    it('should reject names exceeding max length', () => {
      const longName = 'a'.repeat(215);
      const errors = ValidationService.validateProjectName(longName);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('too long');
    });

    it('should provide helpful suggestions', () => {
      const errors = ValidationService.validateProjectName('package');
      expect(errors[0].suggestion).toBeDefined();
      expect(errors[0].suggestion).toContain('package-app');
    });

    it('should accept single character names with valid format', () => {
      const errors = ValidationService.validateProjectName('a');
      expect(errors).toEqual([]);
    });

    it('should accept numbers in project names', () => {
      const errors = ValidationService.validateProjectName('app123');
      expect(errors).toEqual([]);
    });
  });

  describe('validatePackageManager', () => {
    it('should accept valid package managers', () => {
      const validManagers = Object.values(PackageManager);

      validManagers.forEach((manager) => {
        const errors = ValidationService.validatePackageManager(manager);
        expect(errors).toEqual([]);
      });
    });

    it('should reject invalid package managers', () => {
      const invalidManagers = ['bower', 'invalid', 'npm-invalid', ''];

      invalidManagers.forEach((manager) => {
        const errors = ValidationService.validatePackageManager(manager);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].field).toBe('packageManager');
      });
    });

    it('should provide helpful suggestions for invalid managers', () => {
      const errors = ValidationService.validatePackageManager('bower');
      expect(errors[0].suggestion).toContain('npm');
      expect(errors[0].suggestion).toContain('yarn');
      expect(errors[0].suggestion).toContain('pnpm');
    });
  });

  describe('validateDatabase', () => {
    it('should accept valid databases', () => {
      const validDatabases = Object.values(Database);

      validDatabases.forEach((db) => {
        const errors = ValidationService.validateDatabase(db);
        expect(errors).toEqual([]);
      });
    });

    it('should reject invalid databases', () => {
      const invalidDatabases = ['sqlite', 'oracle', 'invalid', ''];

      invalidDatabases.forEach((db) => {
        const errors = ValidationService.validateDatabase(db);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].field).toBe('database');
      });
    });

    it('should provide helpful suggestions for invalid databases', () => {
      const errors = ValidationService.validateDatabase('sqlite');
      expect(errors[0].suggestion).toContain('mysql');
      expect(errors[0].suggestion).toContain('postgres');
      expect(errors[0].suggestion).toContain('mongodb');
    });
  });

  describe('validateORM', () => {
    it('should accept valid ORMs', () => {
      const validORMs = Object.values(ORM);

      validORMs.forEach((orm) => {
        const errors = ValidationService.validateORM(orm, Database.MYSQL);
        expect(errors).toEqual([]);
      });
    });

    it('should reject invalid ORMs', () => {
      const invalidORMs = ['sequelize', 'knex', 'invalid', ''];

      invalidORMs.forEach((orm) => {
        const errors = ValidationService.validateORM(orm, Database.MYSQL);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].field).toBe('orm');
      });
    });

    it('should reject ORM incompatible with MongoDB', () => {
      const errors = ValidationService.validateORM(
        ORM.TYPEORM,
        Database.MONGODB,
      );
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('not compatible');
    });

    it('should accept TypeORM with MySQL and PostgreSQL', () => {
      let errors = ValidationService.validateORM(ORM.TYPEORM, Database.MYSQL);
      expect(errors).toEqual([]);

      errors = ValidationService.validateORM(ORM.TYPEORM, Database.POSTGRES);
      expect(errors).toEqual([]);
    });

    it('should accept Prisma with MySQL and PostgreSQL', () => {
      let errors = ValidationService.validateORM(ORM.PRISMA, Database.MYSQL);
      expect(errors).toEqual([]);

      errors = ValidationService.validateORM(ORM.PRISMA, Database.POSTGRES);
      expect(errors).toEqual([]);
    });

    it('should provide helpful suggestions for incompatible combinations', () => {
      const errors = ValidationService.validateORM(
        ORM.TYPEORM,
        Database.MONGODB,
      );
      expect(errors[0].suggestion).toBeDefined();
    });
  });

  describe('validateAuthStrategies', () => {
    it('should accept valid auth strategies', () => {
      const errors = ValidationService.validateAuthStrategies(['jwt']);
      expect(errors).toEqual([]);
    });

    it('should reject empty strategy array', () => {
      const errors = ValidationService.validateAuthStrategies([]);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('At least one');
    });

    it('should reject invalid strategies', () => {
      const errors = ValidationService.validateAuthStrategies([
        'oauth',
        'saml',
      ]);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].field).toBe('authStrategies');
    });

    it('should handle case-insensitive valid strategies', () => {
      const errors = ValidationService.validateAuthStrategies(['JWT']);
      expect(errors).toEqual([]);
    });

    it('should reject non-array input', () => {
      const errors = ValidationService.validateAuthStrategies(null as any);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateAll', () => {
    it('should validate all fields together', () => {
      const errors = ValidationService.validateAll(
        'my-app',
        'npm',
        'mysql',
        'TypeORM',
      );
      expect(errors).toEqual([]);
    });

    it('should accumulate all validation errors', () => {
      const errors = ValidationService.validateAll(
        'invalid!app',
        'invalid-pm',
        'invalid-db',
        'invalid-orm',
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate optional database and ORM', () => {
      const errors = ValidationService.validateAll('my-app', 'npm');
      expect(errors).toEqual([]);
    });
  });

  describe('formatErrors', () => {
    it('should return empty string for no errors', () => {
      const formatted = ValidationService.formatErrors([]);
      expect(formatted).toBe('');
    });

    it('should format errors with field and suggestion', () => {
      const errors: ValidationError[] = [
        {
          field: 'projectName',
          message: 'Invalid name',
          suggestion: 'Use lowercase letters',
        },
      ];

      const formatted = ValidationService.formatErrors(errors);
      expect(formatted).toContain('❌ Validation failed');
      expect(formatted).toContain('Invalid name');
      expect(formatted).toContain('Use lowercase letters');
    });

    it('should number multiple errors', () => {
      const errors: ValidationError[] = [
        {
          field: 'projectName',
          message: 'Error 1',
        },
        {
          field: 'packageManager',
          message: 'Error 2',
        },
      ];

      const formatted = ValidationService.formatErrors(errors);
      expect(formatted).toContain('1.');
      expect(formatted).toContain('2.');
    });
  });
});
