import {INpmWorkspace} from "../../definitions/npm/i-npm-workspace";
import {INpmPackageService} from "./i-npm-package.service";

/**
 * Service interface for managing npm workspaces
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface INpmWorkspaceService extends INpmPackageService<INpmWorkspace> {
}