import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WompiController } from './wompi.controller';
import { WompiService } from './wompi.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [HttpModule, PrismaModule],
  controllers: [WompiController],
  providers: [WompiService],
  exports: [WompiService],
})
export class WompiModule {}
