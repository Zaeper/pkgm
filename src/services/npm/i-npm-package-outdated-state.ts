export interface INpmPackageOutdatedState {
    isOutdated: boolean,
    currentVersion: string | undefined,
    latestVersion: string,
    deprecated: string | undefined
}