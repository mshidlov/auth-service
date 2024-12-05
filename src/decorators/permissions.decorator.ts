export function Permissions(permissions: {
    resource: string,
    action: string
    }[] = []) {
    return Reflect.metadata('permissions', permissions);
}