import { AuthGuard } from '@nestjs/passport';
import {ExecutionContext, Injectable} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PUBLIC_DECORATOR_KEY } from '../decorators/is-public.decorator';
import { REQUIRE_PERMISSIONS_DECORATOR_KEY } from '../decorators/permissions.decorator';
import { PrivilegeEnum } from '../entities';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  private isPublic(context: ExecutionContext): boolean {
    return this.reflector.get<boolean>(
      PUBLIC_DECORATOR_KEY,
      context.getHandler(),
    );
  }

  private getJwtPayload(context: ExecutionContext): {
    userId: number;
    accountId: number;
    roles: string[];
    permissions: { resource: string; privilege: string }[];
  } {
    const request = context.switchToHttp().getRequest();
    console.dir(request.user);
    return request.user;
  }

  /**
   * Returns whether the request is authorized to activate the handler
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.isPublic(context)) {
      return true;
    }

    // Check context with AuthGuard
    if (!(await super.canActivate(context))) {
      return false;
    }

    const user = this.getJwtPayload(context);
    if (!user) {
      return false;
    }

    return this.canActivatePermissions(context, user);

  }

  private canActivatePermissions(
    context: ExecutionContext,
    user: {
      userId: number;
      accountId: number;
      permissions: { resource: string; privilege: string }[];
    },
  ) {
    const requiredPermission = this.reflector.get<
      {
        resource: string;
        privilege: PrivilegeEnum;
      }[]
    >(REQUIRE_PERMISSIONS_DECORATOR_KEY, context.getHandler());
    if (!requiredPermission) {
      return true;
    }
    return requiredPermission.every((it) =>
      user.permissions.some(
        (permission) =>
          permission.resource === it.resource &&
          permission.privilege === it.privilege,
      ),
    );
  }
}
