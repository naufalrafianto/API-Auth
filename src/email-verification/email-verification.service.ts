import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { User } from '../users/users.entity';
import { OTP } from './entities/otp.entity';

@Injectable()
export class EmailVerificationService {
  constructor(
    @InjectRepository(OTP)
    private otpRepository: Repository<OTP>,
  ) {}

  async generateOTP(user: User): Promise<OTP> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    const otp = this.otpRepository.create({
      code,
      expiresAt,
      user,
      userId: user.id,
    });

    return this.otpRepository.save(otp);
  }

  async verifyOTP(userId: string, code: string): Promise<boolean> {
    const otp = await this.otpRepository.findOne({
      where: {
        userId,
        code,
        used: false,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (!otp) {
      return false;
    }

    otp.used = true;
    await this.otpRepository.save(otp);

    return true;
  }
}
