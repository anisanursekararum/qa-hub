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

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'Current password is required.' })
  oldPassword!: string;

  @IsNotEmpty({ message: 'New password is required.' })
  @MinLength(8, { message: 'New password must be at least 8 characters long.' })
  newPassword!: string;
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

export class ForgotPasswordRequestDto {
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @IsNotEmpty({ message: 'Email is required.' })
  email!: string;
}

export class ForgotPasswordResetDto {
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @IsNotEmpty({ message: 'Email is required.' })
  email!: string;

  @IsNotEmpty({ message: 'Verification code is required.' })
  code!: string;

  @IsNotEmpty({ message: 'New password is required.' })
  @MinLength(8, { message: 'New password must be at least 8 characters long.' })
  newPassword!: string;
}
