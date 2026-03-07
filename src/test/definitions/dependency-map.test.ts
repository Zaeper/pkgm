import { describe, expect, it } from "@jest/globals";
import { DependencyMap } from "../../definitions/dependency-map";

describe("DependencyMap", () => {
    describe("getters", () => {
        it("should return dependencies", () => {
            const dependencies = { lodash: "4.17.21" };
            const peerDependencies = { react: "18.0.0" };
            const devDependencies = { jest: "29.0.0" };

            const map = new DependencyMap(dependencies, peerDependencies, devDependencies);

            expect(map.dependencies).toEqual(dependencies);
        });

        it("should return peerDependencies", () => {
            const dependencies = { lodash: "4.17.21" };
            const peerDependencies = { react: "18.0.0" };
            const devDependencies = { jest: "29.0.0" };

            const map = new DependencyMap(dependencies, peerDependencies, devDependencies);

            expect(map.peerDependencies).toEqual(peerDependencies);
        });

        it("should return devDependencies", () => {
            const dependencies = { lodash: "4.17.21" };
            const peerDependencies = { react: "18.0.0" };
            const devDependencies = { jest: "29.0.0" };

            const map = new DependencyMap(dependencies, peerDependencies, devDependencies);

            expect(map.devDependencies).toEqual(devDependencies);
        });
    });

    describe("summarizedDependencies", () => {
        it("should merge all dependencies when no overlap", () => {
            const dependencies = { lodash: "4.17.21" };
            const peerDependencies = { react: "18.0.0" };
            const devDependencies = { jest: "29.0.0" };

            const map = new DependencyMap(dependencies, peerDependencies, devDependencies);

            expect(map.summarizedDependencies).toEqual({
                lodash: "4.17.21",
                react: "18.0.0",
                jest: "29.0.0"
            });
        });

        it("should keep the lower version when same dependency exists in multiple places", () => {
            const dependencies = { lodash: "4.17.21" };
            const peerDependencies = { lodash: "4.17.20" };
            const devDependencies = { lodash: "4.17.19" };

            const map = new DependencyMap(dependencies, peerDependencies, devDependencies);

            expect(map.summarizedDependencies.lodash).toBe("4.17.19");
        });

        it("should handle empty dependency objects", () => {
            const map = new DependencyMap({}, {}, {});

            expect(map.summarizedDependencies).toEqual({});
        });

        it("should handle partially overlapping dependencies", () => {
            const dependencies = { lodash: "4.17.21", axios: "1.0.0" };
            const peerDependencies = { lodash: "4.17.19", react: "18.0.0" };
            const devDependencies = { jest: "29.0.0" };

            const map = new DependencyMap(dependencies, peerDependencies, devDependencies);

            expect(map.summarizedDependencies).toEqual({
                lodash: "4.17.19",
                axios: "1.0.0",
                react: "18.0.0",
                jest: "29.0.0"
            });
        });
    });
});
