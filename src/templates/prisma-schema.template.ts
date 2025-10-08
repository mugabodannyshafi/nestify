import { Database } from '../constants/enums';

export function createPrismaSchema(database: Database): string {
  const provider =
    database === Database.MYSQL
      ? 'mysql'
      : database === Database.POSTGRES
        ? 'postgresql'
        : 'mysql';

  return `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${provider}"
  url      = env("DATABASE_URL")
}

// Example model - modify according to your needs
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;
}
