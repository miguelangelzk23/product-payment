import { Controller, Post, Body } from '@nestjs/common';
import { WompiService } from './wompi.service';
import { PaymentRequestDto } from './dto/payment-request.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Pagos (Wompi)')
@Controller('wompi')
export class WompiController {
  constructor(private readonly wompiService: WompiService) {}

  @Post('pay')
  @ApiOperation({ summary: 'Procesa un pago completo con tarjeta de crédito vía Wompi' })
  async processPayment(@Body() paymentData: PaymentRequestDto) {
    // El controlador queda súper limpio, todo el trabajo lo hace el servicio maestro
    return this.wompiService.createTransaction(paymentData);
  }
}
