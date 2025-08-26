# CGO_ENABLED=1 Issue and Solutions

This document explains the CGO_ENABLED=1 problem referenced in [go-task/task#1272](https://github.com/go-task/task/issues/1272) and how it's addressed in this project.

## The Problem

When using go-task, if `CGO_ENABLED=0` is set in the shell environment and exported, it takes precedence over any task file environment variable definitions. This means that even if you define:

```yaml
tasks:
  build:
    env:
      CGO_ENABLED: 1
    cmds:
      - go build .
```

The build will still run with `CGO_ENABLED=0` because the shell environment variable overrides the task environment.

## Why This Matters for Our Project

Our web application uses SQLite with the `mattn/go-sqlite3` driver, which requires CGO to be enabled. Building with `CGO_ENABLED=0` will result in build failures or runtime issues.

## Solutions Implemented

### 1. Direct Command Environment Setting (Recommended)

Instead of setting `CGO_ENABLED` in the task's `env` section, set it directly in the command:

```yaml
tasks:
  build:
    cmds:
      - CGO_ENABLED=1 go build -o ./bin/web-app-caa ./cmd/web-app-caa
```

This approach works because the environment variable is set for that specific command execution.

### 2. Shell Export with Command Chaining

Use shell export with command chaining:

```yaml
tasks:
  build:
    cmds:
      - export CGO_ENABLED=1 && go build -o ./bin/web-app-caa ./cmd/web-app-caa
```

### 3. Eval Workaround (Alternative)

Create a helper task that outputs the export command and use eval:

```yaml
tasks:
  shell-env:
    cmds:
      - echo "export CGO_ENABLED=1"
    silent: true

  build:
    cmds:
      - eval $(task shell-env) && go build -o ./bin/web-app-caa ./cmd/web-app-caa
```

## Current Implementation

Our `Taskfile.yml` uses the **direct command environment setting** approach (Solution #1) for all Go-related tasks:

- `build`: Builds with `CGO_ENABLED=1` for SQLite support
- `build-nocgo`: Builds with `CGO_ENABLED=0` for static binaries
- `run`: Runs with `CGO_ENABLED=1`
- `test`: Tests with `CGO_ENABLED=1`

## Testing the Issue

To reproduce the issue and verify our solutions work:

1. Export `CGO_ENABLED=0` in your shell:
   ```bash
   export CGO_ENABLED=0
   ```

2. Run the task build:
   ```bash
   task build
   ```

3. The build should succeed because we use direct command environment setting.

## GitHub Actions Integration

Our CI/CD pipeline in `.github/workflows/build-container.yml` ensures CGO works by:

- Installing GCC compiler before building the Docker container
- The Dockerfile handles CGO_ENABLED=1 for SQLite support

## References

- [go-task/task#1272](https://github.com/go-task/task/issues/1272) - Original issue report
- [Task FAQ: Why won't my task update my shell environment?](https://taskfile.dev/faq/#why-wont-my-task-update-my-shell-environment)
- [CGO Documentation](https://pkg.go.dev/cmd/cgo)

## Best Practices

1. **Always set CGO_ENABLED directly in commands** when using go-task
2. **Install proper build dependencies** in CI/CD environments
3. **Test both CGO-enabled and CGO-disabled builds** when applicable
4. **Document CGO requirements** for your project dependencies
