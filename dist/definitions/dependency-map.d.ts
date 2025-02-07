export declare class DependencyMap {
    private readonly _dependencies;
    private readonly _peerDependencies;
    private readonly _devDependencies;
    constructor(dependencies: Record<string, string>, peerDependencies: Record<string, string>, devDependencies: Record<string, string>);
    get dependencies(): Record<string, string>;
    get peerDependencies(): Record<string, string>;
    get devDependencies(): Record<string, string>;
    get summarizedDependencies(): Record<string, string>;
}
