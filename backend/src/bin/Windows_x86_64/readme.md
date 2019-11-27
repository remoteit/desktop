# remote.it CLI

[![GoDoc](https://godoc.org/github.com/remoteit/cli?status.svg)](https://godoc.org/github.com/remoteit/cli) [![MIT License](http://img.shields.io/:license-mit-blue.svg)](https://github.com/remoteit/cli/blob/master/LICENSE) [![Go Report Card](https://goreportcard.com/badge/github.com/remoteit/cli)](https://goreportcard.com/report/github.com/remoteit/cli) [![Test Status](https://github.com/remoteit/cli/workflows/Test/badge.svg)](https://github.com/remoteit/cli/actions) ![code size](https://img.shields.io/github/languages/code-size/remoteit/cli?style=flat-square)

### NOTE: IN DEVELOPMENT

**This project is in active development and is not ready for use yet. If you want to use remote.it on your devices, please see <https://docs.remote.it> to get setup!**

## Features

- Written in Go
- Cross platform

## Overview

- **Config File**:
  - The source of truth for the remote.it CLI
  - By default it lives in `$HOME/.remoteit/config.json` if run as a user or `/etc/remoteit/config.json` if run as root.
  - On Windows, it is always located at `C:/remoteit/config.json`
- **Config Watcher**:
  - Notifies the process manager when the config file changes
- **Process Manager**:
  - Updates running processes if the config file changes
  - Starts/stops/restarts target/services/initiators processes if they are added, removed or updated from the config file
- **SChannel Listener**:
  - Listens to the remote.it SChannel UDP port and if it receives an `update` message, it fetches its most recent configuration from the API
  - The API returns an updated list of services/initiators if the device’s product/registration are updated
  - This configuration is written to the config file which updates running processes

## Install

Please [download the latest release](https://github.com/remoteit/cli/releases/latest) for your given operating system from the [Release Page](https://github.com/remoteit/cli/releases).

Download the release and extract the binary and place it onto your system `PATH`.

## Usage

### Setup a device

To setup your machine as a remote.it device, perform the following 3 steps:

```shell
# First, sign into your account
remoteit signin

# Then setup a device
remoteit setup

# Then add services
remoteit add
```

You can add as many services as you'd like.

#### Removing a service

If you want to remove a service, run:

```shell
remoteit remove # or just "rm"
```

#### Get help with commands

To learn more about a command, run `remoteit help`:

```shell
remoteit help add

# or
remoteit add -h
```

#### Signing out

If you would like to signout on your device, you can run `remoteit signout`.

Not that you do not need to be signed into remote.it after you initially setup your device, so it is safe to signout. You will need to sign back in if you need to add/remove services or perform other actions that require signin.

#### Learn about remote.it CLI configuration

To learn exactly where remote.it is putting its configuration, binaries, logs and other general system information, you can run the `remoteit info` command to get a detailed output of this information. add the `--json`/`-j` flag to output this information in JSON format.

#### Specify a different configuration path

If for some reason you need to use a different path for configuration the defaults, you can pass a `--config`/`-c` flag when running a command to use a different path.

```shell
remoteit signin --config path/to/my/config.json
```

Note that you will have to pass in this path for every command in which you want to use this config file otherwise commands default to using the default config location. You can define the environment variable `REMOTEIT_CONFIG_PATH="..."` to set the default config path to use for all commands.

Unless you have a good reason to do this, you probably should not use this command flag.

#### Manage remote.it system service

Setting up a remote.it device configures a system service that runs our software on boot (or login if running as a non-root user). This service can be managed using the `remoteit service` command.

#### Scan your network

```shell
remoteit scan

# Output results in JSON
remoteit scan --json # or just -j
```

#### Manage remote.it tools

remote.it requires some other tools to be installed, including our tools `connectd`, `muxer` and `demuxer`. These get installed automatically for youo when you signin or setup a new device. However, there may be cases where you want to manage them yourself.

```shell
# See all options
remoteit tools

# Install tools if missing
remoteit tools install

# Update all tools
remoteit tools --update # or just -u
```

#### Verbose mode

It can be helpful to turn on verbose mode when you come across issues which will output more debugging information when you run commands. To do so, just pass `--verbose` (or just `-v`) to any command:

```shell
remoteit add -v
```

#### Uninstall remote.it

If you need to remove your remote.it device, you can run `remoteit uninstall`. This will remove everything from you system related to remote.it including all your configuration. Note that this does not remove your device or services from remote.it directly, but you can do this in the web portal.

**Be careful with this command as it is permanent.**

If you uninstall remoteit, you will have to re-configure your device if you want to add remote.it back to your system.

### Environment variables

You can set the following environment variables to control the remote.it CLI's behavior:

- `REMOTEIT_CONFIG_PATH="/path/to/config.json"` path to the config file. Note that you can also set this using the `-c, --config` flag on the CLI to do this.
- `REMOTEIT_HWID="some-hardware-id"` the Hardware ID to use to identify this device.
- `REMOTEIT_VERBOSE=true` to turn on verbose mode. Note you can also use the `-v, --verbose` flag on the CLI to do this.
- `REMOTEIT_DIR="/path/to/remoteit"` to configure where remote.it related files exist. This is used as a root for things like logs and binaries on some systems, primarily Windows.
- `REMOTEIT_LOG_DIR="/path/to/logs"` to configure where logs should be written to.
- `REMOTEIT_BINARY_DIR="/path/to/binaries"` to configure where remote.it related binaries exist.
- `REMOTEIT_CONNECTD_PATH="/path/to/connectd"` to configure where the connectd binary exists.
- `REMOTEIT_MUXER_PATH="/path/to/muxer"` to configure where the muxer binary exists.
- `REMOTEIT_DEMUXER_PATH="/path/to/demuxer"` to configure where the demuxer binary exists.
- `REMOTEIT_SCHANNEL_PORT=5980` to configure what port SChannel should listen on.

Note: You can set these on Mac or Linux using `export VARIABLE="VALUE"` and `set VARIABLE="VALUE"` on Windows.

## Development

### Setup

Checkout the code in your `$GOPATH/src/github.com/remoteit/cli` then:

```shell
go get
go run main.go
```

### Tools

- Using [Cobra](https://github.com/spf13/cobra) for command line option parsing
- Analyize bundle size with [goweight](https://github.com/jondot/goweight)
- Manage configuration with [Viper](https://github.com/spf13/viper)

### Building

#### Automatic releases

Builds are automatically generated using [goreleaser](https://goreleaser.com/) (see `.github/workflows/release.yml` and `.goreleaser.yml`) and are published to [Github Releases](https://github.com/remoteit/cli/releases). Releases are generated for every git tag that is pushed to `master`. If a release is a "pre-release" type of semantic version, it will automatically be flagged as such in the Github release.

To release locally, create a Github personal access token with `repo` access and then place it in `~/.github-token` then install goreleaser and follow its documentation.

```shell
# Test the release
goreleaser --skip-publish --snapshot --rm-dist

# Push a release manually
goreleaser release --rm-dist
```

#### Pull request builds

The `.github/workflows/build.yml` script automatically builds test versions of the CLI for all pushes including Pull Requests. You can view the builds by going to the [Actions](https://github.com/remoteit/cli/actions) page and then clicking on a "build" and downloading the artifacts:

![](https://p198.p4.n0.cdn.getcloudapp.com/items/yAu4mbKz/Screen+Shot+2019-11-17+at+5.36.39+PM.png?v=3b477dae72b91705367dac4d56581bd2)

#### Local test builds

```shell
# Make a build for all supported OSes
make

# Build for your current OS
make build

# Build for a given OS
GOOS=linux make build

# Build just for Windows:
make build_win
```

[Full list of build targets can be found here](https://golang.org/doc/install/source#environment).

### Testing

#### Pull Request testing

All pull requests automatically have tests run using the `.github/workflows/test.yml` Github Action.

#### Local testing

```shell
# test everything
go test ./...

# run all tests in a sub module
go test ./business_logic/...

# run only one test file
go test ./business_logic/services_test.go

# run code coverage with tests
go test -cover ./...

# run benchmarks
go test -bench=. ./...
```
