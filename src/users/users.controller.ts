import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterUserDto } from './dto/register.dto';
import { AuthGuard } from '@nestjs/passport';
import { LoginUserDto } from './dto/login.dto';
import { AuthService } from 'src/auth/auth.service';
import { AccessTokenGuard } from 'src/auth/guards/accessToken.guard';
import { User } from './users.entity';
import { activationDto } from './dto/activation.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  create(@Body() registerUserDto: RegisterUserDto) {
    return this.usersService.register(registerUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Body() loginDto: LoginUserDto) {
    return this.authService.login(loginDto);
  }

  @Post('activate')
  async activateAccount(@Body() activationDto: activationDto) {
    const result = await this.usersService.activateAccount(
      activationDto.userId,
      activationDto.otpCode,
    );
    if (result) {
      return { message: 'Account activated successfully' };
    } else {
      return { message: 'Invalid OTP or user ID' };
    }
  }
  @Post('resend-otp/:userId')
  async resendOTP(@Param('userId') userId: string) {
    await this.usersService.resendOTP(userId);
    return { message: 'OTP resent successfully' };
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  async getMe(@Request() req): Promise<User> {
    const userId = req.user.sub;
    return this.usersService.findById(userId);
  }

  @Get(':email')
  findOne(@Param('email') email: string) {
    return this.usersService.findByEmail(email);
  }
}
