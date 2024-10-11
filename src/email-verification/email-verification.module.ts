import { Module } from '@nestjs/common';
import { EmailVerificationService } from './email-verification.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OTP } from './entities/otp.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OTP])],
  providers: [EmailVerificationService],
  exports: [EmailVerificationService],
})
export class EmailVerificationModule {}
