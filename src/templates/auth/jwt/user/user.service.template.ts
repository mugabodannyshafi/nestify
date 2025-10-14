import { ORM } from '../../../../constants/enums';

export function createUserService(orm?: ORM): string {
  let imports = '';
  let findByEmailMethod = '';
  let createMethod = '';
  let findByIdMethod = '';
  let constructorParams = '';

  switch (orm) {
    case ORM.TYPEORM:
      imports = `import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../database/entities/user.entity';`;
      constructorParams = `@InjectRepository(User) private userRepository: Repository<User>`;
      findByEmailMethod = `return this.userRepository.findOne({ where: { email } });`;
      createMethod = `const user = this.userRepository.create(userData);
    return this.userRepository.save(user);`;
      findByIdMethod = `return this.userRepository.findOne({ where: { id } });`;
      break;

    case ORM.PRISMA:
      imports = `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';`;
      constructorParams = `private prisma: PrismaService`;
      findByEmailMethod = `return this.prisma.user.findUnique({ where: { email } });`;
      createMethod = `return this.prisma.user.create({ data: userData });`;
      findByIdMethod = `return this.prisma.user.findUnique({ where: { id } });`;
      break;

    default: // Mongoose
      imports = `import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';`;
      constructorParams = `@InjectModel(User.name) private userModel: Model<UserDocument>`;
      findByEmailMethod = `return this.userModel.findOne({ email }).exec();`;
      createMethod = `const user = new this.userModel(userData);
    return user.save();`;
      findByIdMethod = `return this.userModel.findById(id).exec();`;
  }

  return `${imports}

@Injectable()
export class UserService {
  constructor(${constructorParams}) {}

  async findByEmail(email: string) {
    ${findByEmailMethod}
  }

  async create(userData: { email: string; password: string }) {
    ${createMethod}
  }

  async findById(id: string) {
    ${findByIdMethod}
  }
}
`;
}
