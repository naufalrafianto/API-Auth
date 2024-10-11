import { IsString } from 'class-validator';

export class LogoutDto {
  @IsString()
  id: string;
}
