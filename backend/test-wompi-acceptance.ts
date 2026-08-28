import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { WompiService } from './src/wompi/wompi.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const wompiService = app.get(WompiService);

  console.log('--- Verificando corrección de getAcceptanceToken ---');
  try {
    const token = await wompiService.getAcceptanceToken();
    console.log('✅ ÉXITO TOTAL! Token de aceptación obtenido:', token);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await app.close();
  }
}

bootstrap();
