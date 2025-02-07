export declare class PathUtil {
    static join(...paths: string[]): string;
    static resolve(...paths: string[]): string;
    static relative(from: string, to: string): string;
    static normalize(path: string): string;
}
