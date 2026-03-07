import fs from "fs";
import Logger from "@ptkdev/logger";

export class JsonUtil {
    private static readonly _LOGGER: Logger = new Logger();

    public static readJson<T>(filePath: string): T {
        try {
            const jsonData: string = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(jsonData);
        } catch (error) {
            JsonUtil._LOGGER.error(`Failed to read or parse JSON file: ${filePath}`);
            throw error;
        }
    }
}