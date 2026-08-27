import { IsString, IsNumber, IsEmail, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PaymentRequestDto {
    @ApiProperty({ example: 500000, description: 'Monto en centavos' })
    @IsNumber()
    amountInCents: number;

    @ApiProperty({ example: 'COP' })
    @IsString()
    @IsNotEmpty()
    currency: string;

    @ApiProperty({ example: 'juan@example.com' })
    @IsEmail()
    customerEmail: string;

    @ApiProperty({ example: 'ORDER-2024-00989' })
    @IsString()
    @IsNotEmpty()
    reference: string;

    @ApiProperty({ example: '4242424242424242' })
    @IsString()
    @IsNotEmpty()
    cardNumber: string;

    @ApiProperty({ example: '123' })
    @IsString()
    @Length(3, 4)
    cvc: string;

    @ApiProperty({ example: '08' })
    @IsString()
    @Length(2, 2)
    expMonth: string;

    @ApiProperty({ example: '28' })
    @IsString()
    @Length(2, 2)
    expYear: string;

    @ApiProperty({ example: 'José Pérez' })
    @IsString()
    @IsNotEmpty()
    cardHolder: string;

    @ApiProperty({ example: 1 })
    @IsNumber()
    installments: number;
}
