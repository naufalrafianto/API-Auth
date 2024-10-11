import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterUserDto {
  @IsNotEmpty()
  @MinLength(6)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class RegisterResponseDto {
  success: boolean;
  message: string;
  data: {
    name: string;
    email: string;
    id: string;
    isActivated: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}
