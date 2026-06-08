import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<T>(err: Error, user: T, info: Error): T {
    if (info instanceof TokenExpiredError) throw new UnauthorizedException('Token expired');
    if (info instanceof JsonWebTokenError || err) throw new UnauthorizedException('Invalid token');
    if (!user) throw new UnauthorizedException();
    return user;
  }
}

