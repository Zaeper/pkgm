import {NpmClientType} from "../../definitions/npm/npm-client-type";

export interface INpmClientService {
    installNpmClient(npmClient: NpmClientType): Promise<void>;
}