import { createPrompt, useKeypress } from "@inquirer/core";

/**
 * Utility class for handling keyboard input prompts
 */
export class KeyPromptUtil {
    /**
     * Creates a key press prompt that waits for specific key(s)
     * @param callback - Function to call when a matching key is pressed
     * @param keyId - Single key name or array of key names to listen for
     * @returns The name of the key that was pressed
     */
    public static async setKeyPrompt( callback: () => void, keyId: string | string[] ): Promise<string> {
        process.stdout.write( "\x1b[?25l" );

        const input = (): Promise<string> => {
                return createPrompt<string, unknown>( ( _, done ) => {
                    useKeypress( ( key, inquirerReadline ) => {
                        const keyInKeyIdArrayPressed: boolean = Array.isArray( keyId ) && keyId.includes( key.name );
                        const specificKeyPressed: boolean = !Array.isArray( keyId ) && key.name === keyId;

                        if ( keyInKeyIdArrayPressed || specificKeyPressed ) {
                            callback();
                            done( key.name );
                            process.stdout.write( "\x1b[?25h" );
                        } else {
                            inquirerReadline.clearLine( 0 );
                        }
                    } );
                    return "\x1b[1A\x1b[9999C";
                } )({});
        }

        return await input();
    }
}