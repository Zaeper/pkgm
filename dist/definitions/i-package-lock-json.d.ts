export interface IPackage {
    version: string;
}
export interface IPackageLockJson {
    packages: Record<string, IPackage>;
}
