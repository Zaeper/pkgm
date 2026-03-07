/**
 * Utility class for reading list files (one entry per line)
 */
import fs from "fs";
import readline from "readline";

/**
 * Utility for handling .list and similar line-based files
 */
export class ListUtil {
    /**
     * Reads a list file and returns an array of lines
     * @param filePath - Path to the list file
     * @returns Array of lines from the file, empty array if file doesn't exist
     */
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