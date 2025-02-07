import semver from "semver/preload";

export class DependencyMap {
    private readonly _dependencies: Record<string, string>;
    private readonly _peerDependencies: Record<string, string>;
    private readonly _devDependencies: Record<string, string>;


    constructor(
        dependencies: Record<string, string>,
        peerDependencies: Record<string, string>,
        devDependencies: Record<string, string>
    ) {
        this._dependencies = dependencies;
        this._peerDependencies = peerDependencies;
        this._devDependencies = devDependencies;
    }


    get dependencies(): Record<string, string> {
        return this._dependencies;
    }

    get peerDependencies(): Record<string, string> {
        return this._peerDependencies;
    }

    get devDependencies(): Record<string, string> {
        return this._devDependencies;
    }

    get summarizedDependencies(): Record<string, string> {
        const dependencyList: Record<string, string>[] = [
            this._dependencies,
            this._devDependencies,
            this._peerDependencies
        ];

        return dependencyList.reduce((
            acc: Record<string, string>,
            curr: Record<string, string>
        ): Record<string, string> => {
            Object.entries(curr).forEach(([dependencyName, dependencyVersion]: [string, string]) => {
                const accDependencyVersion: string | undefined = acc[dependencyName];

                if (!!accDependencyVersion) {
                    if (semver.lt(dependencyVersion, accDependencyVersion)) {
                        acc[dependencyName] = dependencyVersion;
                    }
                } else {
                    acc[dependencyName] = dependencyVersion;
                }
            })

            return acc;
        }, {})
    }
}