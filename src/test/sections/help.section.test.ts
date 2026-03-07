import { describe, expect, it } from "@jest/globals";
import { HelpSection } from "../../sections/help.section";

describe("HelpSection", () => {
    describe("render", () => {
        it("should render help without throwing", () => {
            const helpSection = new HelpSection();

            expect(() => helpSection.render()).not.toThrow();
        });

        it("should return void", () => {
            const helpSection = new HelpSection();

            const result = helpSection.render();

            expect(result).toBeUndefined();
        });
    });
});
