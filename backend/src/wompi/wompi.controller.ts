import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { WompiService } from './wompi.service';
import { PaymentRequestDto } from './dto/payment-request.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Pagos (Wompi)')
@Controller('wompi')
export class WompiController {
  constructor(private readonly wompiService: WompiService) {}

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Consulta el estado de una transacción por ID en Wompi' })
  async getTransactionStatus(@Param('id') id: string) {
    return this.wompiService.getTransactionStatus(id);
  }

  @Post('pay')
  @ApiOperation({ summary: 'Procesa un pago completo con tarjeta de crédito vía Wompi' })
  async processPayment(@Body() paymentData: PaymentRequestDto) {
    return this.wompiService.createTransaction(paymentData);
  }
}
