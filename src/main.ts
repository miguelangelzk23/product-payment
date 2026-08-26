import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para permitir llamadas desde el Frontend
  app.enableCors();

  // Prefijo global de la API
  app.setGlobalPrefix('api');

  // Pipe global para validación estricta de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Product Payment Checkout API')
    .setDescription('API REST para Checkout de productos con pasarela de pagos Wompi/Supabase')
    .setVersion('1.0')
    .addTag('Products')
    .addTag('Transactions')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Servidor ejecutándose en http://localhost:${port}/api`);
  console.log(`📄 Documentación Swagger disponible en http://localhost:${port}/api/docs`);
}
bootstrap();
