import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';

@Injectable()
export class AuthCookieService {
  constructor(private readonly configService: ConfigService) {}

  setSessionCookie(response: Response, token: string): void {
    response.cookie(this.getCookieName(), token, this.getCookieOptions());
  }

  clearSessionCookie(response: Response): void {
    const cookieName = this.getCookieName();
    const options = this.getBaseCookieOptions();

    response.clearCookie(cookieName, options);
    response.cookie(cookieName, '', {
      ...options,
      expires: new Date(0),
      maxAge: 0,
    });
  }

  getCookieName(): string {
    return this.configService.getOrThrow<string>('auth.cookie.name');
  }

  private getCookieOptions(): CookieOptions {
    const options = this.getBaseCookieOptions();
    const maxAge = this.parseDurationToMs(this.configService.get<string>('auth.jwtExpiresIn'));

    if (maxAge !== undefined) {
      options.maxAge = maxAge;
    }

    return options;
  }

  private getBaseCookieOptions(): CookieOptions {
    const options: CookieOptions = {
      httpOnly: true,
      path: '/',
      sameSite: this.getSameSite(),
      secure: this.configService.getOrThrow<boolean>('auth.cookie.secure'),
    };
    const domain = this.configService.get<string>('auth.cookie.domain');

    if (domain) {
      options.domain = domain;
    }

    return options;
  }

  private getSameSite(): CookieOptions['sameSite'] {
    const sameSite = this.configService.get<string>('auth.cookie.sameSite') ?? 'lax';

    if (sameSite === 'lax' || sameSite === 'strict' || sameSite === 'none') {
      return sameSite;
    }

    return 'lax';
  }

  private parseDurationToMs(duration: string | undefined): number | undefined {
    if (!duration) {
      return undefined;
    }

    const match = duration.trim().match(/^(\d+)(ms|s|m|h|d)$/i);

    if (!match) {
      return undefined;
    }

    const [, rawValue, rawUnit] = match;

    if (!rawValue || !rawUnit) {
      return undefined;
    }

    const value = Number(rawValue);
    const unit = rawUnit.toLowerCase();
    const multipliers: Record<string, number> = {
      ms: 1,
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    const multiplier = multipliers[unit];

    if (multiplier === undefined) {
      return undefined;
    }

    return value * multiplier;
  }
}
