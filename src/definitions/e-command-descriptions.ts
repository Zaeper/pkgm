export enum ECommandDescriptions {
    LIST = 'List all configured projects.',
    LIST_DEPENDENCIES = 'List all configured projects along with their dependencies. Projects will be ordered in processing order.',
    LIST_SCRIPTS = 'List all configured projects along with their scripts.',
    LINK = 'Create symlinks of the projects and replaces the projects dependency with the file protocol.',
    UNLINK = 'Removes symlinks of the projects and replaces the dependencies with the package version.',
    RUN = 'Run a specific npm script over your projects.',
    RUN_ASYNC = 'Run a specific npm script asynchronously over your projects.',
    VERSION_MANAGER = 'Manages project dependencies with the version manager. The version managers offers two different update strategies.',
    INSTALL = 'Run npm install over your projects.',
    BUILD = 'Run npm run build over your projects',
    BUILD_WATCH = 'Run npm run build:watch over your projects',
    REINIT = 'Reinit\'s your projects. This includes deleting the according node_module\s, .dist directory and refreshing of the existing symlinks',
    HELP = "Help",
    EXIT = "Exit"
}