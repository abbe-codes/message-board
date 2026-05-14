import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import { type PublicUser } from '../../users/public-user';
import { type AuthenticatedRequest } from '../types/authenticated-request';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): PublicUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    return request.user;
  },
);
