import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password: string;
}

export class LoginResponseDto {
  success: boolean;
  message: string;
  access_token?: string;
  refresh_token?: string;
}
