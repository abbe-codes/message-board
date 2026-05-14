export interface AuthTokenPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}
