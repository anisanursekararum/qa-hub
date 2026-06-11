import { Injectable, ConflictException, UnauthorizedException, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { RegisterDto, LoginDto, AuthResponse, ForgotPasswordRequestDto, ForgotPasswordResetDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    if (process.env.SMTP_URL) {
      this.transporter = nodemailer.createTransport(process.env.SMTP_URL);
    } else {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        auth: {
          user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
          pass: process.env.SMTP_PASS || 'etherealpassword'
        }
      });
    }
  }

  private async sendEmail(to: string, subject: string, text: string) {
    try {
      const info = await this.transporter.sendMail({
        from: '"QA-Hub System" <no-reply@qa-hub.local>',
        to,
        subject,
        text
      });
      console.log('Email sent: %s', nodemailer.getTestMessageUrl(info));
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }

  /**
   * Registers a new user account with a hashed password.
   */
  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists.');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        password: hashedPassword,
        name: dto.name.trim(),
      },
    });

    const token = await this.generateToken(user.id, user.email, user.tokenVersion);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  }

  /**
   * Handles user login with password verification and account lockout checks.
   */
  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    // Check if the account is currently locked out (disabled)
    if (user.disabledUntil && user.disabledUntil > new Date()) {
      const remainingTime = Math.ceil(
        (user.disabledUntil.getTime() - Date.now()) / (1000 * 60),
      );
      throw new ForbiddenException(
        `This account is temporarily locked due to multiple failed join attempts. Please try again in ${remainingTime} minutes.`,
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const token = await this.generateToken(user.id, user.email, user.tokenVersion);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  }

  async changePassword(userId: string, dto: import('./dto/auth.dto').ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    const isPasswordValid = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid current password.');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password updated successfully' };
  }

  async invalidateSessions(userId: string): Promise<{ message: string }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
    return { message: 'All sessions invalidated successfully' };
  }

  /**
   * Generates a signed JWT access token for the authenticated user.
   */
  private async generateToken(userId: string, email: string, tokenVersion: number): Promise<string> {
    const payload = { sub: userId, email, tokenVersion };
    return this.jwtService.signAsync(payload);
  }

  async forgotPasswordRequest(dto: ForgotPasswordRequestDto): Promise<{ message: string }> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User with this email not found.');
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiredAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    await this.prisma.passwordResetOtp.upsert({
      where: { email },
      update: { otp, expiredAt, createdAt: new Date() },
      create: { email, otp, expiredAt },
    });

    const emailSubject = '[QA-Hub] Password Reset Verification Code';
    const emailBody = `Hi ${user.name},

We received a request to reset your QA-Hub account password. Please use the verification code below to proceed with the reset process:

${otp}

Note: This code is only valid for 15 minutes. For security reasons, never share this code with anyone, including the QA-Hub team.

Didn't request this?
If you did not try to reset your password, you can safely ignore this email. Your account remains secure and no changes will be made.

Best regards,
The QA-Hub Team`;

    await this.sendEmail(email, emailSubject, emailBody);

    return { message: 'Verification code sent to email.' };
  }

  async forgotPasswordReset(dto: ForgotPasswordResetDto): Promise<{ message: string }> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const record = await this.prisma.passwordResetOtp.findUnique({
      where: { email },
    });

    if (!record || record.otp !== dto.code.trim() || record.expiredAt < new Date()) {
      throw new BadRequestException('Invalid or expired verification code.');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(dto.newPassword, saltRounds);

    // Update password and invalidate current active sessions
    await this.prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        tokenVersion: { increment: 1 }
      },
    });

    // Clean up OTP record
    await this.prisma.passwordResetOtp.delete({
      where: { email },
    });

    return { message: 'Password reset successfully.' };
  }
}
