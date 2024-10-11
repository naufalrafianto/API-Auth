import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginResponseDto, LoginUserDto } from 'src/users/dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { LogoutDto } from 'src/users/dto/logout.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await user.validatePassword(password))) {
      const userWithoutPassword = { ...user };
      delete userWithoutPassword.password;
      return userWithoutPassword;
    }
    return null;
  }

  async login(loginDto: LoginUserDto): Promise<LoginResponseDto> {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user || !(await user.validatePassword(loginDto.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.getTokens(user.id, user.email);

    await this.storeRefreshToken(user.id, tokens.refreshToken);

    const response: LoginResponseDto = {
      success: true,
      message: 'Login successful',
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    };

    return response;
  }

  async logout(logoutDto: LogoutDto): Promise<void> {
    const user = await this.usersService.findById(logoutDto.id);
    if (user) {
      user.removeRefreshToken(); // Assuming you have a method to remove the refresh token
      await this.usersService.updateUser(user); // Save the updated user
    } else {
      throw new UnauthorizedException('User not found');
    }
  }

  async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (user) {
      await user.hashRefreshToken(refreshToken);
      await this.usersService.updateUser(user);
    }
  }

  async getTokens(userId: string, email: string) {
    const accessToken = await this.jwtService.signAsync(
      {
        sub: userId,
        email,
      },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: '1h',
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: userId,
        email, // include email in the payload
      },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'), // Get the refresh token secret from config
        expiresIn: '7d', // Set refresh token expiry
      },
    );

    return {
      accessToken,
      refreshToken,
    };
  }
}
