import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable global DTO class-validator pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS configuration:
  // - Production: only allow specific Firebase Hosting origin(s) from CORS_ORIGIN env var
  // - Development: allow all origins for local frontend dev server
  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = isProduction
    ? (process.env.CORS_ORIGIN || '').split(',').map((o) => o.trim()).filter(Boolean)
    : true;

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`\n🚀 QA-Hub Core Backend successfully running on: http://localhost:${port}\n`);
  if (isProduction) {
    console.log(`🔒 CORS restricted to: ${Array.isArray(allowedOrigins) ? allowedOrigins.join(', ') : 'all'}\n`);
  }
}
bootstrap();

