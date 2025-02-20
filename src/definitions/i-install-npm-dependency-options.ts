export interface IInstallNpmDependencyOptions {
    dependencyName: string,
    dependencyCategory?: "dependency" | "devDependency" | "peerDependency"
}