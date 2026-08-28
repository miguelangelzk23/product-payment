import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { PaymentRequestDto } from './dto/payment-request.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WompiService {
    private readonly apiUrl = process.env.PAYMENT_GATEWAY_BASE_URL || 'https://api-sandbox.co.uat.wompi.dev/v1';
    private readonly publicKey = process.env.WOMPI_PUBLIC_KEY || process.env.PAYMENT_GATEWAY_PUBLIC_KEY;
    private readonly privateKey = process.env.WOMPI_PRIVATE_KEY || process.env.PAYMENT_GATEWAY_PRIVATE_KEY;
    private readonly integritySecret = process.env.WOMPI_INTEGRITY_SECRET || process.env.PAYMENT_GATEWAY_INTEGRITY_SECRET;

    constructor(
        private readonly httpService: HttpService,
        private readonly prisma: PrismaService,
    ) { }

    // Helper to decrement stock in db on approved transactions
    async decrementStock(productId: string, quantity: number): Promise<void> {
        try {
            await this.prisma.stock.update({
                where: { productId },
                data: {
                    quantity: {
                        decrement: quantity,
                    },
                },
            });
            console.log(`📉 Stock decremented by ${quantity} for product: ${productId}`);
        } catch (error) {
            console.error(`Failed to decrement stock for product ${productId}:`, error);
        }
    }

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

    // 5. Crear la Transacción Completa y guardar registros en BD
    async createTransaction(dto: PaymentRequestDto) {
        // A. Buscar o registrar al cliente en base de datos
        let customer = await this.prisma.customer.findFirst({
            where: {
                OR: [
                    { email: dto.customerEmail },
                    {
                        documentType: dto.customerDocumentType,
                        documentNumber: dto.customerDocumentNumber,
                    },
                ],
            },
        });

        if (!customer) {
            customer = await this.prisma.customer.create({
                data: {
                    email: dto.customerEmail,
                    fullName: dto.customerFullName,
                    phoneNumber: dto.customerPhoneNumber,
                    documentType: dto.customerDocumentType,
                    documentNumber: dto.customerDocumentNumber,
                },
            });
        }

        const reference = dto.reference || `TX-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        // B. Intentar procesar pago con pasarela Wompi
        let gatewayStatus = 'DECLINED';
        let providerTxId: string | null = null;
        let cardBrand: string | null = null;
        let cardLastFour: string | null = null;
        let responseData: any = null;

        try {
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

            const response: any = await firstValueFrom(
                this.httpService.post(`${this.apiUrl}/transactions`, transactionPayload, {
                    headers: { Authorization: `Bearer ${this.privateKey}` }
                })
            );

            responseData = response.data;
            providerTxId = responseData?.data?.id || null;
            gatewayStatus = responseData?.data?.status || 'PENDING';
            cardBrand = responseData?.data?.payment_method?.extra?.brand || null;
            cardLastFour = responseData?.data?.payment_method?.extra?.last_four || null;

            if (gatewayStatus === 'PENDING' && providerTxId) {
                for (let attempt = 0; attempt < 5; attempt++) {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    try {
                        const statusData = await this.getTransactionStatus(providerTxId);
                        const status = statusData?.data?.status;
                        if (status && status !== 'PENDING') {
                            gatewayStatus = status;
                            responseData = statusData;
                            cardBrand = statusData?.data?.payment_method?.extra?.brand || cardBrand;
                            cardLastFour = statusData?.data?.payment_method?.extra?.last_four || cardLastFour;
                            break;
                        }
                    } catch (pollErr) {}
                }
            }
        } catch (error: any) {
            console.error('Wompi API call failed:', error.response?.data || error.message);
            gatewayStatus = 'ERROR';
            responseData = {
                status: 'ERROR',
                errorMessage: error.response?.data?.message || 'Error en pasarela de pagos Wompi',
            };
        }

        // C. Mapear estado de Wompi para la base de datos
        let dbStatus: 'PENDING' | 'APPROVED' | 'DECLINED';
        if (gatewayStatus === 'APPROVED') {
            dbStatus = 'APPROVED';
        } else if (gatewayStatus === 'PENDING') {
            dbStatus = 'PENDING';
        } else {
            dbStatus = 'DECLINED';
        }

        // D. Guardar los datos de la transacción en la base de datos (independientemente del estado)
        const baseFee = 500000; // $5,000 COP
        const deliveryFee = 1200000; // $12,000 COP
        const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
        const productAmount = product ? product.priceInCents : 0;

        let dbTransaction;
        try {
            dbTransaction = await this.prisma.transaction.create({
                data: {
                    reference: reference,
                    customerId: customer.id,
                    productId: dto.productId,
                    quantity: 1,
                    productAmount: productAmount,
                    baseFee: baseFee,
                    deliveryFee: deliveryFee,
                    totalAmount: dto.amountInCents,
                    status: dbStatus,
                    providerTransactionId: providerTxId,
                    cardBrand: cardBrand,
                    cardLastFour: cardLastFour ? cardLastFour.slice(0, 4) : null,
                },
            });

            // Guardar los datos de envío en la base de datos (independientemente del estado de la transacción)
            await this.prisma.delivery.create({
                data: {
                    transactionId: dbTransaction.id,
                    addressLine: dto.deliveryAddressLine,
                    city: dto.deliveryCity,
                    region: dto.deliveryRegion,
                    status: 'PENDING',
                },
            });
        } catch (dbError) {
            console.error('Failed to write transaction/delivery to database:', dbError);
            throw new InternalServerErrorException('Error guardando la compra en la base de datos');
        }

        // E. Si el pago fue aprobado, descontar del stock en base de datos
        if (dbStatus === 'APPROVED') {
            await this.decrementStock(dto.productId, 1);
        }

        // F. Si hubo un error en la pasarela de pagos, lanzar excepción tras haber guardado el registro
        if (gatewayStatus === 'ERROR') {
            throw new InternalServerErrorException(responseData.errorMessage || 'Error procesando el pago en Wompi');
        }

        return responseData;
    }
}
