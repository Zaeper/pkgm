import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { ListUtil } from "../../utils/list.util";
import fs from "fs";
import { Readable } from "stream";

jest.mock("fs");

describe("ListUtil", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("readList", () => {
        it("should return empty array if file does not exist", async () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);

            const result = await ListUtil.readList("/path/to/nonexistent.list");

            expect(result).toEqual([]);
        });

        it("should read lines from file", async () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            
            const mockReadable = new Readable({
                read() {
                    this.push("line1\n");
                    this.push("line2\n");
                    this.push("line3\n");
                    this.push(null);
                }
            });
            
            (fs.createReadStream as jest.Mock).mockReturnValue(mockReadable);

            const result = await ListUtil.readList("/path/to/file.list");

            expect(result).toEqual(["line1", "line2", "line3"]);
        });

        it("should handle empty file", async () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            
            const mockReadable = new Readable({
                read() {
                    this.push(null);
                }
            });
            
            (fs.createReadStream as jest.Mock).mockReturnValue(mockReadable);

            const result = await ListUtil.readList("/path/to/empty.list");

            expect(result).toEqual([]);
        });

        it("should handle single line without newline", async () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            
            const mockReadable = new Readable({
                read() {
                    this.push("singleline");
                    this.push(null);
                }
            });
            
            (fs.createReadStream as jest.Mock).mockReturnValue(mockReadable);

            const result = await ListUtil.readList("/path/to/file.list");

            expect(result).toEqual(["singleline"]);
        });

        it("should handle Windows-style line endings", async () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            
            const mockReadable = new Readable({
                read() {
                    this.push("line1\r\n");
                    this.push("line2\r\n");
                    this.push(null);
                }
            });
            
            (fs.createReadStream as jest.Mock).mockReturnValue(mockReadable);

            const result = await ListUtil.readList("/path/to/file.list");

            expect(result).toEqual(["line1", "line2"]);
        });
    });
});
