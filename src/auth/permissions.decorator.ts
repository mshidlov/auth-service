import {PrivilegeEnum} from "./privilege.enum";
import {CustomDecorator, SetMetadata} from "@nestjs/common";

export const REQUIRE_PERMISSIONS_DECORATOR_KEY = 'require-permissions'

export const RequirePermissions = (...permissions: { resource:string, privilege: PrivilegeEnum }[]): CustomDecorator => SetMetadata<string,  { resource:string, privilege: PrivilegeEnum }[]>(REQUIRE_PERMISSIONS_DECORATOR_KEY, permissions);
