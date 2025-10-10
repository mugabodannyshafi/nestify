import { ORM } from '../../../../constants/enums';

export function createUserModule(orm?: ORM): string {
  let imports = `import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';`;
  let moduleImports = '';

  switch (orm) {
    case ORM.TYPEORM:
      imports += `
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';`;
      moduleImports = `TypeOrmModule.forFeature([User])`;
      break;

    case ORM.PRISMA:
      imports += `
import { PrismaModule } from '../../../prisma/prisma.module';`;
      moduleImports = `PrismaModule`;
      break;

    default: // Mongoose
      imports += `
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';`;
      moduleImports = `MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])`;
  }

  return `${imports}

@Module({
  imports: [${moduleImports}],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
`;
}
