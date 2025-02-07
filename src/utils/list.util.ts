/**
 * Util to handle .list files
 */
import fs from "fs";
import readline from "readline";

export class ListUtil {
    public static async readList(filePath: string): Promise<string[]> {
        const lines: string[] = [];

        if(!fs.existsSync(filePath)) {
            return [];
        }

        const fileStream = fs.createReadStream(filePath);

        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        for await (const line of rl) {
            lines.push(line);
        }

        return lines;
    }
}