import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  OneToMany,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { OTP } from 'src/email-verification/entities/otp.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: false })
  isActivated: boolean;

  @Column({ nullable: true })
  activationToken: string;

  @Column({ nullable: true })
  refreshToken: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => OTP, (otp) => otp.user)
  otps: OTP[];

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  async hashRefreshToken(refreshToken: string): Promise<void> {
    this.refreshToken = await bcrypt.hash(refreshToken, 10);
  }

  async validateRefreshToken(refreshToken: string): Promise<boolean> {
    return bcrypt.compare(refreshToken, this.refreshToken);
  }

  removeRefreshToken(): void {
    this.refreshToken = null; // Assuming you have a `refreshToken` property
  }
}
