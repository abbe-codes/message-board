import type { Request } from 'express';

import { type PublicUser } from '../../users/public-user';

export interface AuthenticatedRequest extends Request {
  cookies: Record<string, string | undefined>;
  user: PublicUser;
}
