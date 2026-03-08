/**
 * Strategy for handling npm version conflicts during installation
 */
export enum EVersionConflictStrategy {
    /**
     * No special handling - use default npm behavior
     */
    NONE = "none",
    /**
     * Use --legacy-peer-deps flag
     */
    LEGACY_PEER_DEPS = "legacy-peer-deps",
    /**
     * Use --force flag
     */
    FORCE = "force"
}
