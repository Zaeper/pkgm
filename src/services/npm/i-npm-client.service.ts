import {NpmClientType} from "../../definitions/npm/npm-client-type";

/**
 * Service interface for npm client management
 */
export interface INpmClientService {
    /**
     * Installs the specified npm client globally if not already available
     * @param npmClient - The npm client to install (npm, pnpm, yarn, bun)
     */
    installNpmClient(npmClient: NpmClientType): Promise<void>;
}