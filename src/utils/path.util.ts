import Path from "path";

export class PathUtil {
    public static join(...paths: string[]): string {
        return PathUtil.normalize(Path.join(...paths));
    }

    public static resolve(...paths: string[]): string {
        return PathUtil.normalize(Path.resolve(...paths));
    }

    public static relative(from: string, to: string): string {
        return PathUtil.normalize(Path.relative(from, to));
    }

    public static normalize(path: string): string {
        return path.split("\\").join("/")
    }
}