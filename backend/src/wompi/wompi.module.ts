import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WompiService } from './wompi.service';
import { WompiController } from './wompi.controller';
import * as https from 'https';

@Module({
  imports: [
    HttpModule.register({
      // Esto ignora errores de certificados SSL (útil para el sandbox UAT de Wompi)
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    }),
  ],
  providers: [WompiService],
  controllers: [WompiController]
})
export class WompiModule {}
