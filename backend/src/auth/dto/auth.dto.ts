import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @IsNotEmpty({ message: 'Email is required.' })
  email!: string;

  @IsNotEmpty({ message: 'Password is required.' })
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  password!: string;

  @IsNotEmpty({ message: 'Name is required.' })
  name!: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @IsNotEmpty({ message: 'Email is required.' })
  email!: string;

  @IsNotEmpty({ message: 'Password is required.' })
  password!: string;
}

export interface UserPayload {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  user: UserPayload;
  token: string;
}
