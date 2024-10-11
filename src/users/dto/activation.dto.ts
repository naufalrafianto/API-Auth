import { IsNotEmpty } from 'class-validator';

export class activationDto {
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  otpCode: string;
}
