import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { PaymentRequestDto } from './dto/payment-request.dto';

@Injectable()
export class WompiService {
    private readonly apiUrl = 'https://api-sandbox.co.uat.wompi.dev/v1';

    // Leemos las llaves desde las variables de entorno
    private readonly publicKey = process.env.WOMPI_PUBLIC_KEY;
    private readonly privateKey = process.env.WOMPI_PRIVATE_KEY;
    private readonly integritySecret = process.env.WOMPI_INTEGRITY_SECRET;

    constructor(private readonly httpService: HttpService) { }

    // 1. Obtener Token de Aceptación (Términos legales)
    async getAcceptanceToken(): Promise<string> {
        try {
            const response: any = await firstValueFrom(
                this.httpService.get(`${this.apiUrl}/merchants/${this.publicKey}`)
            );
            return response.data.data.presigned_acceptance.acceptance_token;
        } catch (error) {
            throw new InternalServerErrorException('Error obteniendo acceptance token de Wompi');
        }
    }

    // 2. Tokenizar la Tarjeta de Crédito
    async tokenizeCard(dto: PaymentRequestDto): Promise<string> {
        try {
            const payload = {
                number: dto.cardNumber,
                cvc: dto.cvc,
                exp_month: dto.expMonth,
                exp_year: dto.expYear,
                card_holder: dto.cardHolder
            };

            const response: any = await firstValueFrom(
                this.httpService.post(`${this.apiUrl}/tokens/cards`, payload, {
                    headers: { Authorization: `Bearer ${this.publicKey}` }
                })
            );
            return response.data.data.id;
        } catch (error) {
            throw new InternalServerErrorException('Error tokenizando la tarjeta en Wompi');
        }
    }

    // 3. Generar Firma Criptográfica (reutilizamos tu lógica)
    generateSignature(reference: string, amount: number, currency: string): string {
        const concatenatedString = `${reference}${amount}${currency}${this.integritySecret}`;
        return crypto.createHash('sha256').update(concatenatedString).digest('hex');
    }

    // 4. Orquestador: Crear la Transacción Completa
    async createTransaction(dto: PaymentRequestDto) {
        // Paso A: Conseguir tokens necesarios (Llamadas en paralelo serían más rápidas, pero secuencial está bien)
        const acceptanceToken = await this.getAcceptanceToken();
        const cardToken = await this.tokenizeCard(dto);

        // Paso B: Firmar la transacción
        const signature = this.generateSignature(dto.reference, dto.amountInCents, dto.currency);

        // Paso C: Armar el payload final de la transacción
        const transactionPayload = {
            amount_in_cents: dto.amountInCents,
            currency: dto.currency,
            customer_email: dto.customerEmail,
            payment_method: {
                type: "CARD",
                token: cardToken,
                installments: dto.installments
            },
            signature: signature,
            reference: dto.reference,
            acceptance_token: acceptanceToken
        };

        // Paso D: Enviar a Wompi para ejecutar el cobro
        try {
            const response: any = await firstValueFrom(
                this.httpService.post(`${this.apiUrl}/transactions`, transactionPayload, {
                    headers: { Authorization: `Bearer ${this.privateKey}` }
                })
            );
            return response.data; // Aquí vendrá el status (APPROVED, DECLINED, PENDING)
        } catch (error: any) {
            // Imprimimos el error de Wompi en consola para facilitar el debug
            console.error('Detalle del error de Wompi:', error.response?.data);
            throw new InternalServerErrorException('Error procesando el pago en Wompi');
        }
    }
}
