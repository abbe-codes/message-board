import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../../users/users.service';
import { type AuthTokenPayload } from '../types/auth-token-payload';
import { type AuthenticatedRequest } from '../types/authenticated-request';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.cookies?.[this.configService.getOrThrow<string>('auth.cookie.name')];

    if (!token) {
      throw new UnauthorizedException('Authentication required.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<AuthTokenPayload>(token, {
        secret: this.configService.getOrThrow<string>('auth.jwtSecret'),
      });
      const user = await this.usersService.findPublicById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('Authentication required.');
      }

      request.user = user;

      return true;
    } catch {
      throw new UnauthorizedException('Authentication required.');
    }
  }
}
