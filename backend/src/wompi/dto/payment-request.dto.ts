import { IsNotEmpty, IsNumber, IsString, IsEmail, IsOptional } from 'class-validator';

export class PaymentRequestDto {
  @IsNotEmpty()
  @IsNumber()
  amountInCents: number;

  @IsNotEmpty()
  @IsString()
  currency: string;

  @IsNotEmpty()
  @IsEmail()
  customerEmail: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsNotEmpty()
  @IsString()
  cardNumber: string;

  @IsNotEmpty()
  @IsString()
  cvc: string;

  @IsNotEmpty()
  @IsString()
  expMonth: string;

  @IsNotEmpty()
  @IsString()
  expYear: string;

  @IsNotEmpty()
  @IsString()
  cardHolder: string;

  @IsNotEmpty()
  @IsNumber()
  installments: number;
}
