export function createUserSchemaMongoose(): string {
  return `import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
  import { Document } from 'mongoose';
  
  export type UserDocument = User & Document;
  
  @Schema({ timestamps: true })
  export class User {
    @Prop({ required: true, unique: true })
    email: string;
  
    @Prop({ required: true })
    password: string;
  }
  
  export const UserSchema = SchemaFactory.createForClass(User);
  `;
}
