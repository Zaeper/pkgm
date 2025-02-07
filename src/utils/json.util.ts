import fs from "fs";

export class JsonUtil {
    public static readJson<T>(filePath: string): T {
        const jsonData: string = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(jsonData);
    }
}