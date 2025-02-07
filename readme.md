<div align="center">
  <a href="https://zaeper.com">
    <picture>
      <img alt="Zaeper logo" src="https://zaeper-public-storage.fra1.cdn.digitaloceanspaces.com/zaeper_full_vertical-logo.svg" height="192">
    </picture>
  </a>
  <h1>PKGM - Package Management</h1>
  Efficiently manage and link your npm projects with PKGM, a powerful workspace and dependency manager for multi-project environments.
  <br>
  <br>
  <img alt="MIT license" src="https://img.shields.io/badge/License-MIT-blue.svg">
  <a href="https://www.npmjs.com/package/@zaeper/pkgm"><img alt="NPM version" src="https://img.shields.io/npm/v/@zaeper/pkgm.svg"></a>
  <a href="https://github.com/sponsors/zaeper"><img alt="Sponsors" src="https://img.shields.io/badge/sponsor-%F0%9F%92%96-white"/></a>
</div>

## Installation

To install PKGM globally, run:

```bash
npm install -g @zaeper/pkgm
```

## Getting Started

### ⚠️ Important: Run PKGM from the root directory of your multi-project setup.

PKGM can run in any multi-project setup. So you can nest your projects and libraries just the way you like.

```
:root dir * <--- Run PKGM from here
│
└───libs
│   │
│   └───Library1
│   └───Library2
│       ...
└───Project1
└───Project2
```

### Setup

#### Interactive Setup

Run `pkgm` in an uninitialized directory to launch the initialization mode:

```bash
pkgm
```

Follow the on-screen instructions. PKGM will scan all subdirectories from its execution directory to identify npm
projects. If the scanning process takes too long, create a `pkgm.ignore` file to exclude specific directories from the
scan.

**Example `pkgm.ignore` file:**

```plain
**/.idea/**
**/.git/**
**/logs/**
**/build/**
```

#### Manual Setup

Alternatively, configure PKGM manually with a `pkgm.json` file in your project directory.

**Example `pkgm.json` file:**

```json
{
  "npmClient": "** npm | pnpm | yarn | bun **",
  "projects": [
    "** Paths to your npm projects **"
  ],
  "workspaces": [
    "** Optional **",
    "** Paths to your npm workspaces **"
  ],
  "excludeSymlinks": [
    "** Optional **",
    "** NPM Projects to be excluded from linking **"
  ],
  "versions": {
    "** optional **": "*",
    "NPM Package Name": "Version"
  }
}
```

## Usage

### Modes

#### Interactive Mode

Simply run `pkgm` without arguments to start PKGM in interactive mode, allowing you to manage projects through a guided
interface.

**Command**

```bash
pkgm
```

![pkgm command example](https://zaeper-public-storage.fra1.cdn.digitaloceanspaces.com/pkgm-interactive-example.gif)

#### Command-Line Mode

Run specific commands directly to perform tasks.

**Example:**

```bash
pkgm listScripts --scope-path=libs/
```

### Available Commands


| Command            | Required Arguments                                       | Optional Arguments    | Description                                                                                                                                                                                                                                                                                                                                                                 |
|--------------------|----------------------------------------------------------|-----------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `list`             |                                                          |                       | List all configured projects.                                                                                                                                                                                                                                                                                                                                               |
| `listDependencies` |                                                          |                       | Lists all configured projects along with their dependencies in processing order.                                                                                                                                                                                                                                                                                            |
| `listScripts`      |                                                          |                       | List all configured projects along with their scripts.                                                                                                                                                                                                                                                                                                                      |
| `link`             |                                                          |                       | Create symlinks of the projects and replaces the projects dependency with the file protocol.                                                                                                                                                                                                                                                                                |
| `unlink`           |                                                          |                       | Removes symlinks of the projects and replaces the dependencies with the package version.                                                                                                                                                                                                                                                                                    |
| `run`              | [NPM Script]                                             |                       | Run a specific npm script over your projects.                                                                                                                                                                                                                                                                                                                               |
| `runAsync`         | [NPM Script]                                             |                       | Run a specific npm script asynchronously over your projects.                                                                                                                                                                                                                                                                                                                |
| `install`          |                                                          | --package-name        | Run npm install over your projects.                                                                                                                                                                                                                                                                                                                                         |
| `versionManager`   | <b>update-versions</b><br />or<br /><b>sync-versions</b> |                       | Manages project dependencies. The version manager provides two different strategies:<br /><br /><b>Update Versions:</b> PKGM recommends and installs the highest available version of your project dependencies based on their peerDependency.<br /><br /><b>Sync Versions:</b> Updates all matching dependencies to the defined versions specified in your pkgm.json file. |
| `build`            |                                                          |                       | Run npm run build over your projects                                                                                                                                                                                                                                                                                                                                        |
| `buildWatch`       |                                                          |                       | Run npm run build:watch over your projects                                                                                                                                                                                                                                                                                                                                  |
| `reinit`           |                                                          | --delete-package-lock | Re-initialize your projects. This includes deleting the according node_modules, .dist directory and refreshing of the existing symlinks                                                                                                                                                                                                                                     |
| `help`             |                                                          |                       | Displays a list of available commands and their descriptions.                                                                                                                                                                                                                                                                                                               |

### Global Parameters

You can use all global parameters alongside the commands listed above.

| Parameter              | Description                                                                                                 |
|------------------------|-------------------------------------------------------------------------------------------------------------|
| `--scope-path`         | Scope the project list by path. The path must match entries in `package.json`.                              |
| `--scope-package-name` | Scope the project list by package name. Matches entries in `package.json`.                                  |
| `--exclude-path`       | Exclude a path from the project list. Must exactly match paths in `pkgm.json`. Can be used multiple times.  |
| `--scope-package-name` | Define specific projects to process. Overrides the project list in `pkgm.json`. Can be used multiple times. |

## Linking Projects

To link your projects together, add the target project to your `package.json`.

Let’s assume that Project1 needs access to Library1. Here's how you can set it up:

*package.json for Project1:*
```json
{
  "name": "project1",
  "version": "1.0.1",
  "main": "index.js",
  "dependencies": {
    "library1": "0.0.1"
  }
}
```

Once you've added Library1 as a dependency in Project1, run the `pkgm link` command from your root directory, either in command-line or interactive mode.

Example in command-line mode:
```bash
pkgm link --scope-package-name=project1
```

After running the command, your `package.json` for Project1 should look like this:
```json
{
  "name": "project1",
  "version": "1.0.1",
  "main": "index.js",
  "dependencies": {
    "library1": "file://./path/to/library1"
  }
}
```

To ensure the symlink works with `buildWatch`, make sure to disable the `preserveSymlink` option in your `tsconfig` file.

## Building Projects

To properly build your projects, ensure that each project you want to build includes both a `build` and `build:watch` script in its `package.json`.

*Example `package.json` for an Angular library:*
```json
{
  "name": "library1",
  "version": "0.0.1",
  "main": "index.js",
  "scripts": {
    "build": "ng build",
    "build:watch": "ng build --watch"
  }
}
```

Once the build scripts are configured, you can run the `pkgm build` or `pkgm build:watch` command:

```bash
pkgm build --scope-package-name=library1
```
or
```bash
pkgm buildWatch --scope-package-name=library1
```

### Watching Multiple Projects

Since build watchers run asynchronously, there’s a chance that one project might still be building while another project that depends on it starts its build process. This can lead to errors if the dependent project attempts to build before the previous one has finished.

Since PKGM cannot automatically detect when a build process has completed, you’ll need to manually wait for the previous build to finish before initiating the next one.

![PKGM build watch example](https://zaeper-public-storage.fra1.cdn.digitaloceanspaces.com/pkgm-build-watch-example.gif)

## Roadmap

- Adding the ability to create libraries and projects directly from PKGM.
- Multilevel dependency scanning for better dependency management.
- Setting up comprehensive documentation on zaeper.io
- Supporting version overrides in Version Manager
- Implementing and creating an external API Server for caching and faster dependency evaluation in Version Manager

## About Zaeper

Zaeper is an innovative, unfunded digital signage startup based in Switzerland. Our vision is to create a public SaaS
digital signage platform that empowers users worldwide. To support this mission, we have and will continue to
open-source our development tools we use daily, fostering collaboration and transparency within the community.

If you like this project, please consider to support us on Github Sponsors. This will help us to further maintain and
develop our products.

🚀 Learn more about Zaeper at [https://zaeper.com](https://zaeper.com).

Thank you for considering a sponsorship! ❤️

[![Sponsor](https://img.shields.io/badge/sponsor-%F0%9F%92%96-white)](https://github.com/sponsors/zaeper)