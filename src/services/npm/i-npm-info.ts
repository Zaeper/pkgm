export interface INpmInfoPeerDependenciesMeta {
    optional: boolean
}

export interface INpmInfoDistTags {
    latest: string;
    next?: string
}

export interface INpmInfo {
    name: string[];
    version: string;
    peerDependencies?: Record<string, string>;
    versions: string[];
    bin?: Record<string, string>;
    deprecated: string;
    peerDependenciesMeta?: Record<string, INpmInfoPeerDependenciesMeta>;
}