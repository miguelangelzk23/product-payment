import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WompiController } from './wompi.controller';
import { WompiService } from './wompi.service';

@Module({
  imports: [HttpModule],
  controllers: [WompiController],
  providers: [WompiService],
  exports: [WompiService],
})
export class WompiModule {}
