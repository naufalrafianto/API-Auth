import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users.entity';
import { RegisterResponseDto, RegisterUserDto } from './dto/register.dto';
import { EmailService } from 'src/email/email.service';
import { EmailVerificationService } from 'src/email-verification/email-verification.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private emailService: EmailService,
    private emailVerificationService: EmailVerificationService,
  ) {}

  async findById(id: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async saveUser(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }

  async updateUser(user: User) {
    return this.usersRepository.update({ email: user.email }, user);
  }

  async register(
    registerUserDto: RegisterUserDto,
  ): Promise<RegisterResponseDto> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: registerUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists.');
    }

    const newUser = this.usersRepository.create(registerUserDto);
    await this.usersRepository.save(newUser);

    const otp = await this.emailVerificationService.generateOTP(newUser);
    await this.emailService.sendVerificationEmail(
      newUser.email,
      newUser.name,
      otp.code,
    );

    const response: RegisterResponseDto = {
      success: true,
      message:
        'User registered successfully. Please check your email for the OTP to activate your account.',
      data: {
        name: newUser.name,
        email: newUser.email,
        id: newUser.id,
        isActivated: newUser.isActivated,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
    };

    return response;
  }

  async activateAccount(userId: string, otpCode: string): Promise<boolean> {
    const isValid = await this.emailVerificationService.verifyOTP(
      userId,
      otpCode,
    );

    if (isValid) {
      const user = await this.usersRepository.findOne({
        where: { id: userId },
      });
      if (user) {
        user.isActivated = true;
        await this.usersRepository.save(user);
        return true;
      }
    }

    return false;
  }

  async resendOTP(userId: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      const newOTP = await this.emailVerificationService.resendOTP(userId);
      await this.emailService.sendVerificationEmail(
        user.email,
        user.name,
        newOTP.code,
      );
    } catch (error) {
      console.error('Error resending OTP:', error);
      throw new InternalServerErrorException('Failed to resend OTP');
    }
  }
  async findByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
