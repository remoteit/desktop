## Setup

### Pre-Requisites

- Yarn 1.13.0
- Node 11.14.0

### Installation

```bash
git clone git@github.com:react-workspaces/react-workspaces-playground.git
cd react-workspaces-playground
yarn
```

### Adding workspace dependencies

```bash
yarn workspace <workspace_name> <command>
```

This will run the chosen Yarn command in the selected workspace.

Example:

```bash
yarn workspace my-app add react-router-dom --dev
```

This will add `react-router-dom` as `dependencies` in your `packages/my-app/package.json`. To remove dependency use `remove` instead of add

## Usage

### Starting Project in Workspace

From your project root type start command for desired app

```bash
yarn workspace @project/app-single-comp start
```
