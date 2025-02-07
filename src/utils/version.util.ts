import semver, {Comparator, SemVer} from "semver";

export class VersionUtil {
    /**
     * Derives the most appropriate version operator based on a given version and range.
     * Handles all range syntaxes, including logical OR (`||`), AND (`&&`), and mixed conditions.
     *
     * @param {string} version - The specific version (e.g., "1.0.5").
     * @param {string} range - The semver range (e.g., ">1.0.0 || <1.1.0").
     * @returns {string} - The derived version operator (e.g., "^", "~", or an empty string if no operator fits).
     */
    public static getVersionOperator(version: string, range: string): "^" | "~" | null {
        // Validate inputs
        if (!semver.valid(version)) {
            throw new Error(`Invalid version: ${version}`);
        }
        if (!semver.validRange(range)) {
            throw new Error(`Invalid range: ${range}`);
        }

        const parsedVersion: SemVer | null = semver.coerce(version);
        const parsedRange = new semver.Range(range);

        if (!semver.satisfies(version, range) || parsedVersion === null) {
            return null;
        }

        const rangeSets = parsedRange.set;

        if(rangeSets.length === 1) {
            const definedOperator: string | undefined = range.match(/^\D/)?.[0];

            if(definedOperator === undefined) return "^";

            if(["~", "^"].includes(definedOperator)) {
                return <"~"|"^">definedOperator;
            }
            if([">"].includes(definedOperator)) {
                return "^"
            }
            if(["<"].includes(definedOperator)) {
                if(parsedVersion.major > parsedVersion.major) {
                    return "^";
                }
                if(parsedVersion.minor > parsedVersion.minor) {
                    return "~";
                }
            }
            return null;
        }

        for (const subRange of rangeSets) {
            const maxRangeVersion: Comparator | undefined = subRange.find((r) => r.operator === "<=" || r.operator === "<");

            if (maxRangeVersion && semver.lt(version, maxRangeVersion.semver.version)) {
                if(maxRangeVersion.semver.major > parsedVersion.major) {
                    return "^";
                }
                if(maxRangeVersion.semver.minor > parsedVersion.minor) {
                    return "~";
                }
                return null;
            }
        }

        return null;
    }
}