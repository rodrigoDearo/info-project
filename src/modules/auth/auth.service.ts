import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedUser } from '../../shared/decorators/current-user.decorator';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login({ nickname, password }: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.usersService.findByNickname(nickname);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: AuthenticatedUser = {
      sub: user.id,
      nickname: user.nickname,
      email: user.email,
    };

    return { accessToken: this.jwtService.sign(payload) };
  }
}

