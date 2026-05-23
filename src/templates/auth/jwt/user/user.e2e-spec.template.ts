import { ORM } from '../../../../constants/enums';

export function createUserE2ESpec(orm?: ORM): string {
  let imports = '';
  let dataSourceDeclaration = '';
  let dataSourceCleanup = '';
  let afterEachCleanup = '';

  switch (orm) {
    case ORM.TYPEORM:
      imports = `import { DataSource } from 'typeorm';`;
      dataSourceDeclaration = `let dataSource: DataSource;`;
      dataSourceCleanup = `dataSource = moduleFixture.get<DataSource>(DataSource);`;
      afterEachCleanup = `const repository = dataSource.getRepository('User');
    await repository.clear();`;
      break;

    case ORM.PRISMA:
      imports = `import { PrismaService } from '../src/prisma/prisma.service';`;
      dataSourceDeclaration = `let prismaService: PrismaService;`;
      dataSourceCleanup = `prismaService = moduleFixture.get<PrismaService>(PrismaService);`;
      afterEachCleanup = `await prismaService.user.deleteMany({});`;
      break;

    default: // Mongoose
      imports = `import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';`;
      dataSourceDeclaration = `let connection: Connection;`;
      dataSourceCleanup = `connection = moduleFixture.get<Connection>(getConnectionToken());`;
      afterEachCleanup = `await connection.collection('users').deleteMany({});`;
  }

  return `import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
${imports}

describe('Users (e2e)', () => {
  let app: INestApplication;
  ${dataSourceDeclaration}
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    ${dataSourceCleanup}
  });

  afterAll(async () => {
    // Clean up database
    ${
      orm === ORM.TYPEORM
        ? `if (dataSource) {
      await dataSource.dropDatabase();
      await dataSource.destroy();
    }`
        : ''
    }
    ${
      orm === ORM.PRISMA
        ? `if (prismaService) {
      await prismaService.user.deleteMany({});
      await prismaService.$disconnect();
    }`
        : ''
    }
    ${
      orm !== ORM.TYPEORM && orm !== ORM.PRISMA
        ? `if (connection) {
      await connection.dropDatabase();
      await connection.close();
    }`
        : ''
    }
    await app.close();
  });

  afterEach(async () => {
    // Clean up users table after each test
    ${afterEachCleanup}
  });

  describe('/users/me (GET)', () => {
    beforeEach(async () => {
      // Register a user and get access token before each test
      const response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'testuser@example.com',
        password: 'Password123!',
      });

      accessToken = response.body.access_token;
      userId = response.body.user.id;
    });

    it('should get current user profile with valid token', async () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', \`Bearer \${accessToken}\`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', userId);
          expect(res.body).toHaveProperty('email', 'testuser@example.com');
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');
          expect(res.body).toHaveProperty('password');
        });
    });

    it('should return correct user data structure', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', \`Bearer \${accessToken}\`)
        .expect(200)
        .expect((res) => {
          ${
            orm === ORM.TYPEORM
              ? `expect(res.body.id).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
          );`
              : 'expect(res.body.id).toBeDefined();'
          }
          expect(typeof res.body.email).toBe('string');
          expect(res.body.email).toContain('@');
          expect(new Date(res.body.createdAt)).toBeInstanceOf(Date);
          expect(new Date(res.body.updatedAt)).toBeInstanceOf(Date);
        });
    });

    it('should return 401 without authorization header', () => {
      return request(app.getHttpServer()).get('/users/me').expect(401);
    });

    it('should return 401 with invalid token', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });

    it('should return 401 with malformed authorization header', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);
    });

    it('should return 401 without Bearer prefix', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', accessToken)
        .expect(401);
    });

    it('should return 401 with empty token', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', 'Bearer ')
        .expect(401);
    });
  });

  describe('Multiple Users', () => {
    it('should return correct user for each token', async () => {
      // Register first user
      const user1Response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'user1@example.com',
        password: 'Password123!',
      });

      const user1Token = user1Response.body.access_token;
      const user1Id = user1Response.body.user.id;

      // Register second user
      const user2Response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'user2@example.com',
        password: 'Password456!',
      });

      const user2Token = user2Response.body.access_token;
      const user2Id = user2Response.body.user.id;

      // Get first user's profile
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', \`Bearer \${user1Token}\`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(user1Id);
          expect(res.body.email).toBe('user1@example.com');
        });

      // Get second user's profile
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', \`Bearer \${user2Token}\`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(user2Id);
          expect(res.body.email).toBe('user2@example.com');
        });

      // Verify users are different
      expect(user1Id).not.toBe(user2Id);
    });
  });

  describe('Token Persistence', () => {
    it('should use same token for multiple requests', async () => {
      // Register user
      const response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'persistent@example.com',
        password: 'Password123!',
      });

      const token = response.body.access_token;
      const userId = response.body.user.id;

      // First request
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', \`Bearer \${token}\`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(userId);
        });

      // Second request with same token
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', \`Bearer \${token}\`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(userId);
        });

      // Third request with same token
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', \`Bearer \${token}\`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(userId);
        });
    });
  });

  describe('User Profile After Login', () => {
    it('should access profile after login', async () => {
      // Register user
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'logintest@example.com',
        password: 'Password123!',
      });

      // Login
      const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
        email: 'logintest@example.com',
        password: 'Password123!',
      });

      const loginToken = loginResponse.body.access_token;
      const loginUserId = loginResponse.body.user.id;

      // Get profile with login token
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', \`Bearer \${loginToken}\`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(loginUserId);
          expect(res.body.email).toBe('logintest@example.com');
        });
    });
  });

  describe('Security', () => {
    it('should not allow access with token from different user', async () => {
      // Register first user
      const user1Response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'user1@example.com',
        password: 'Password123!',
      });

      const user1Token = user1Response.body.access_token;

      // Register second user
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'user2@example.com',
        password: 'Password456!',
      });

      // Try to access with user1's token
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', \`Bearer \${user1Token}\`)
        .expect(200)
        .expect((res) => {
          // Should return user1's data, not user2's
          expect(res.body.email).toBe('user1@example.com');
          expect(res.body.email).not.toBe('user2@example.com');
        });
    });
  });
});
`;
}
