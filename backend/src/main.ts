import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
    rawBody: true,
  });

  // 增加请求体大小限制（支持 base64 图片上传）
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // 启用 CORS - 动态允许前端域名
  app.enableCors({
    origin: (origin, callback) => {
      // 允许无 origin 的请求（如移动端、服务器端请求）
      if (!origin) return callback(null, true);

      // 检查是否来自前端端口（13002 或 3000）
      const allowedPorts = [13002, 3000];
      try {
        const url = new URL(origin);
        if (allowedPorts.includes(parseInt(url.port))) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      } catch {
        callback(new Error('Invalid origin'));
      }
    },
    credentials: true,
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 设置全局前缀
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
}
bootstrap();
