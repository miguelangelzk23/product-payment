import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { HttpModule } from '@nestjs/axios';
import { WompiModule } from './wompi/wompi.module';

@Module({
  imports: [PrismaModule, ProductsModule, HttpModule, WompiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
