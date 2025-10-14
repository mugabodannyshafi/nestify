export function createLoginDto(): string {
  return `import { ApiProperty } from '@nestjs/swagger';
  import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
  
  export class LoginDto {
    @ApiProperty({
      example: 'user@example.com',
      description: 'User email address',
    })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;
  
    @ApiProperty({
      example: 'password123',
      description: 'User password',
      minLength: 6,
    })
    @IsString()
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    password: string;
  }
  `;
}
