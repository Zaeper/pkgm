import { ISection } from "./i-section";
import { ECommand } from "../definitions/e-command";
export declare class MainNavigationSection implements ISection<ECommand> {
    private _lastRunCommand;
    render(): Promise<ECommand>;
    private _exitListener;
    private _assembleMenuItem;
    private _captureExitInput;
    private _discardExitInput;
}
