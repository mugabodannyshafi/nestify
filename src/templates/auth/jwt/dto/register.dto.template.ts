export function createRegisterDto(): string {
  return `import { ApiProperty } from '@nestjs/swagger';
  import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
  
  export class RegisterDto {
    @ApiProperty({
      example: 'user@example.com',
      description: 'User email address',
    })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;
  
    @ApiProperty({
      example: 'Password123!',
      description: 'User password (min 6 characters, at least one uppercase, one lowercase, one number)',
      minLength: 6,
    })
    @IsString()
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    @Matches(/((?=.*\\d)|(?=.*\\W+))(?![.\\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
      message: 'Password must contain uppercase, lowercase, and number/special character',
    })
    password: string;
  }
  `;
}
