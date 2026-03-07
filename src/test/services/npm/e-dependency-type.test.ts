import { describe, expect, it } from "@jest/globals";
import { EDependencyType } from "../../../services/npm/e-dependency-type";

describe("EDependencyType", () => {
    it("should have DEPENDENCY type", () => {
        expect(EDependencyType.DEPENDENCY).toBeDefined();
    });

    it("should have DEV_DEPENDENCY type", () => {
        expect(EDependencyType.DEV_DEPENDENCY).toBeDefined();
    });

    it("should have PEER_DEPENDENCY type", () => {
        expect(EDependencyType.PEER_DEPENDENCY).toBeDefined();
    });

    it("should have different values", () => {
        const types = [
            EDependencyType.DEPENDENCY,
            EDependencyType.DEV_DEPENDENCY,
            EDependencyType.PEER_DEPENDENCY
        ];
        const uniqueTypes = new Set(types);
        expect(uniqueTypes.size).toBe(3);
    });
});
