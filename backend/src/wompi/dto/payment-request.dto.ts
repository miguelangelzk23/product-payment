import { IsNotEmpty, IsNumber, IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';

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

  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNotEmpty()
  @IsString()
  customerFullName: string;

  @IsNotEmpty()
  @IsString()
  customerPhoneNumber: string;

  @IsNotEmpty()
  @IsEnum(['CC', 'CE', 'NIT', 'PP'])
  customerDocumentType: 'CC' | 'CE' | 'NIT' | 'PP';

  @IsNotEmpty()
  @IsString()
  customerDocumentNumber: string;

  @IsNotEmpty()
  @IsString()
  deliveryAddressLine: string;

  @IsNotEmpty()
  @IsString()
  deliveryCity: string;

  @IsNotEmpty()
  @IsString()
  deliveryRegion: string;
}
