export function createUserPrismaSchema(): string {
  return `// Add this to your schema.prisma file:
  
  model User {
    id        String   @id @default(uuid())
    email     String   @unique
    password  String
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
  
    @@map("users")
  }
  `;
}
