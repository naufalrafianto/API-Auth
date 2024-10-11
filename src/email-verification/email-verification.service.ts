import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, MoreThan } from 'typeorm';
import { User } from '../users/users.entity';
import { OTP } from './entities/otp.entity';

@Injectable()
export class EmailVerificationService {
  constructor(
    @InjectRepository(OTP)
    private otpRepository: Repository<OTP>,
  ) {}

  async generateOTP(user: User, entityManager?: EntityManager): Promise<OTP> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    const otp = this.otpRepository.create({
      code,
      expiresAt,
      user,
      userId: user.id,
    });

    if (entityManager) {
      return entityManager.save(otp);
    } else {
      return this.otpRepository.save(otp);
    }
  }

  async resendOTP(userId: string): Promise<OTP> {
    const user = await this.otpRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.resendAttempts >= 3) {
      throw new BadRequestException('Maximum resend attempts reached');
    }

    // Invalidate the old OTP
    await this.otpRepository.update({ userId, used: false }, { used: true });

    // Generate a new OTP
    const newOTP = await this.generateOTP(user.user);
    newOTP.resendAttempts = (user.resendAttempts || 0) + 1;
    return this.otpRepository.save(newOTP);
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
