import { EVersionConflictStrategy } from "./e-version-conflict-strategy";

export interface IInstallNpmDependencyOptions {
    dependencyName?: string,
    dependencyCategory?: "dependency" | "devDependency" | "peerDependency",
    versionConflictStrategy?: EVersionConflictStrategy
}