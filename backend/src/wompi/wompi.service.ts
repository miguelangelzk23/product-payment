import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { PaymentRequestDto } from './dto/payment-request.dto';

@Injectable()
export class WompiService {
    private readonly apiUrl = process.env.PAYMENT_GATEWAY_BASE_URL || 'https://api-sandbox.co.uat.wompi.dev/v1';
    private readonly publicKey = process.env.WOMPI_PUBLIC_KEY || process.env.PAYMENT_GATEWAY_PUBLIC_KEY;
    private readonly privateKey = process.env.WOMPI_PRIVATE_KEY || process.env.PAYMENT_GATEWAY_PRIVATE_KEY;
    private readonly integritySecret = process.env.WOMPI_INTEGRITY_SECRET || process.env.PAYMENT_GATEWAY_INTEGRITY_SECRET;

    constructor(private readonly httpService: HttpService) { }

    // 1. Obtener Token de Aceptación
    async getAcceptanceToken(): Promise<string> {
        try {
            const response: any = await firstValueFrom(
                this.httpService.get(`${this.apiUrl}/merchants/${this.publicKey}`)
            );
            return response.data.data.presigned_acceptance.acceptance_token;
        } catch (error: any) {
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
        } catch (error: any) {
            throw new InternalServerErrorException('Error tokenizando la tarjeta en Wompi');
        }
    }

    // 3. Generar Firma Criptográfica
    generateSignature(reference: string, amount: number, currency: string): string {
        const concatenatedString = `${reference}${amount}${currency}${this.integritySecret}`;
        return crypto.createHash('sha256').update(concatenatedString).digest('hex');
    }

    // 4. Consultar Estado de una Transacción por ID
    async getTransactionStatus(id: string): Promise<any> {
        try {
            const response: any = await firstValueFrom(
                this.httpService.get(`${this.apiUrl}/transactions/${id}`, {
                    headers: { Authorization: `Bearer ${this.publicKey}` }
                })
            );
            return response.data;
        } catch (error: any) {
            throw new InternalServerErrorException('Error consultando el estado de la transacción en Wompi');
        }
    }

    // 5. Crear la Transacción Completa
    async createTransaction(dto: PaymentRequestDto) {
        const reference = dto.reference || `TX-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        const acceptanceToken = await this.getAcceptanceToken();
        const cardToken = await this.tokenizeCard(dto);
        const signature = this.generateSignature(reference, dto.amountInCents, dto.currency);

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
            reference: reference,
            acceptance_token: acceptanceToken
        };

        try {
            const response: any = await firstValueFrom(
                this.httpService.post(`${this.apiUrl}/transactions`, transactionPayload, {
                    headers: { Authorization: `Bearer ${this.privateKey}` }
                })
            );

            const initialResponse = response.data;
            const transactionId = initialResponse?.data?.id;
            let currentStatus = initialResponse?.data?.status;

            if (currentStatus === 'PENDING' && transactionId) {
                for (let attempt = 0; attempt < 5; attempt++) {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    try {
                        const statusData = await this.getTransactionStatus(transactionId);
                        currentStatus = statusData?.data?.status;
                        if (currentStatus && currentStatus !== 'PENDING') {
                            return statusData;
                        }
                    } catch (pollErr) {}
                }
            }

            return initialResponse;
        } catch (error: any) {
            console.error('Detalle del error de Wompi:', error.response?.data || error.message);
            throw new InternalServerErrorException('Error procesando el pago en Wompi');
        }
    }
}
