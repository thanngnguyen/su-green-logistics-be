import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS
  const allowedOrigins = [
    'http://localhost:3000',
    'https://greentransports.vercel.app',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // API prefix
  const apiPrefix = configService.get('app.apiPrefix') || 'api';
  const apiVersion = configService.get('app.apiVersion') || 'v1';
  app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(
    `🚀 Green Logistics API running on port ${port} | /${apiPrefix}/${apiVersion}`,
  );
}

bootstrap();
