# Installation
> `npm install --save @types/args`

# Summary
This package contains type definitions for args (https://github.com/leo/args#readme).

# Details
Files were exported from https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/args.
## [index.d.ts](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/args/index.d.ts)
````ts
declare const c: args;
export = c;

interface args {
    sub: string[];

    option(name: string | [string, string], description: string, defaultValue?: any, init?: OptionInitFunction): args;
    options(list: Option[]): args;
    command(
        name: string,
        description: string,
        init?: (name: string, sub: string[], options: ConfigurationOptions) => void,
        aliases?: string[],
    ): args;
    example(usage: string, description: string): args;
    examples(list: Example[]): args;
    parse(argv: string[], options?: ConfigurationOptions): { [key: string]: any };
    showHelp(): void;
    showVersion(): void;
}

type OptionInitFunction = (value: any) => any;

interface MriOptions {
    args?: string[] | undefined;
    alias?: {
        [key: string]: string | string[];
    } | undefined;
    boolean?: string | string[] | undefined;
    default?: {
        [key: string]: any;
    } | undefined;
    string?: string | string[] | undefined;
    unknown?: ((param: string) => boolean) | undefined;
}

interface MinimistOptions {
    string?: string | string[] | undefined;
    boolean?: boolean | string | string[] | undefined;
    alias?: {
        [key: string]: string | string[];
    } | undefined;
    default?: {
        [key: string]: any;
    } | undefined;
    stopEarly?: boolean | undefined;
    "--"?: boolean | undefined;
    unknown?: ((param: string) => boolean) | undefined;
}

interface ConfigurationOptions {
    help?: boolean | undefined;
    name?: string | undefined;
    version?: boolean | undefined;
    usageFilter?: ((output: any) => any) | undefined;
    value?: string | undefined;
    mri: MriOptions;
    minimist?: MinimistOptions | undefined;
    mainColor: string | string[];
    subColor: string | string[];
}

interface Option {
    name: string | [string, string];
    description: string;
    init?: OptionInitFunction | undefined;
    defaultValue?: any;
}

interface Example {
    usage: string;
    description: string;
}

````

### Additional Details
 * Last updated: Mon, 06 Nov 2023 22:41:04 GMT
 * Dependencies: none

# Credits
These definitions were written by [Slessi](https://github.com/Slessi).
