import { ORM } from '../../../constants/enums';

export function createAuthE2ESpec(orm?: ORM): string {
  let imports = '';
  let dataSourceDeclaration = '';
  let dataSourceCleanup = '';
  let afterEachCleanup = '';

  switch (orm) {
    case ORM.TYPEORM:
      imports = `import { DataSource } from 'typeorm';`;
      dataSourceDeclaration = `let dataSource: DataSource;`;
      dataSourceCleanup = `dataSource = moduleFixture.get<DataSource>(DataSource);`;
      afterEachCleanup = `if (dataSource) {
      await dataSource.dropDatabase();
      await dataSource.destroy();
    }`;
      break;

    case ORM.PRISMA:
      imports = `import { PrismaService } from '../src/prisma/prisma.service';`;
      dataSourceDeclaration = `let prismaService: PrismaService;`;
      dataSourceCleanup = `prismaService = moduleFixture.get<PrismaService>(PrismaService);`;
      afterEachCleanup = `if (prismaService) {
      await prismaService.user.deleteMany({});
      await prismaService.$disconnect();
    }`;
      break;

    default: // Mongoose
      imports = `import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';`;
      dataSourceDeclaration = `let connection: Connection;`;
      dataSourceCleanup = `connection = moduleFixture.get<Connection>(getConnectionToken());`;
      afterEachCleanup = `if (connection) {
      await connection.dropDatabase();
      await connection.close();
    }`;
  }

  return `import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
${imports}

describe('Authentication (e2e)', () => {
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
    ${afterEachCleanup}
    await app.close();
  });

  afterEach(async () => {
    // Clean up users table after each test
    ${orm === ORM.TYPEORM ? "const repository = dataSource.getRepository('User');\n    await repository.clear();" : ''}
    ${orm === ORM.PRISMA ? 'await prismaService.user.deleteMany({});' : ''}
    ${orm !== ORM.TYPEORM && orm !== ORM.PRISMA ? "await connection.collection('users').deleteMany({});" : ''}
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'Password123!',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('id');
          expect(res.body.user).toHaveProperty('email', 'newuser@example.com');
          expect(res.body.user).not.toHaveProperty('password');
        });
    });

    it('should return 409 when registering with existing email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'Password123!',
      };

      // First registration
      await request(app.getHttpServer()).post('/auth/register').send(userData).expect(201);

      // Second registration with same email
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('already exists');
        });
    });

    it('should return 400 when email is invalid', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
        })
        .expect(400);
    });

    it('should return 400 when password is missing', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
        })
        .expect(400);
    });

    it('should return 400 when request body is empty', () => {
      return request(app.getHttpServer()).post('/auth/register').send({}).expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      // Register a user before each login test
      const response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'loginuser@example.com',
        password: 'Password123!',
      });

      userId = response.body.user.id;
    });

    it('should login successfully with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'loginuser@example.com',
          password: 'Password123!',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('id', userId);
          expect(res.body.user).toHaveProperty('email', 'loginuser@example.com');
          expect(res.body.user).not.toHaveProperty('password');
          accessToken = res.body.access_token;
        });
    });

    it('should return 401 with invalid password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'loginuser@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401);
    });

    it('should return 401 with non-existent email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(401);
    });
  });

  describe('/auth/profile (GET)', () => {
    beforeEach(async () => {
      // Register and login to get access token
      const response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'profileuser@example.com',
        password: 'Password123!',
      });

      accessToken = response.body.access_token;
      userId = response.body.user.id;
    });

    it('should get user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', \`Bearer \${accessToken}\`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', userId);
          expect(res.body).toHaveProperty('email', 'profileuser@example.com');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should return 401 without authorization header', () => {
      return request(app.getHttpServer()).get('/auth/profile').expect(401);
    });

    it('should return 401 with invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });

    it('should return 401 with malformed authorization header', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);
    });

    it('should return 401 with expired token', async () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature')
        .expect(401);
    });
  });

  describe('Authentication Flow', () => {
    it('should complete full authentication flow', async () => {
      const userEmail = 'flowtest@example.com';
      const userPassword = 'Password123!';

      // 1. Register
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: userEmail,
          password: userPassword,
        })
        .expect(201);

      expect(registerResponse.body).toHaveProperty('access_token');
      const registerToken = registerResponse.body.access_token;
      const registeredUserId = registerResponse.body.user.id;

      // 2. Get profile with registration token
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', \`Bearer \${registerToken}\`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(registeredUserId);
          expect(res.body.email).toBe(userEmail);
        });

      // 3. Login with same credentials
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userEmail,
          password: userPassword,
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('access_token');
      const loginToken = loginResponse.body.access_token;

      // 4. Get profile with login token
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', \`Bearer \${loginToken}\`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(registeredUserId);
          expect(res.body.email).toBe(userEmail);
        });
    });
  });
});
`;
}
