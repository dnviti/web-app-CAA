# Summary: CGO_ENABLED=1 Problem Fix

## Problem Reference
- **GitHub Issue**: [go-task/task#1272](https://github.com/go-task/task/issues/1272)
- **Issue**: `CGO_ENABLED` cannot be set to `1` when go-task is invoked with `CGO_ENABLED=0`

## Root Cause
When `CGO_ENABLED=0` is exported in the shell environment, it takes precedence over task environment variable definitions, preventing tasks from overriding it to `1`.

## Solutions Implemented

### ✅ 1. Direct Command Environment Setting (Primary Solution)
```yaml
# In Taskfile.yml
tasks:
  build:
    cmds:
      - CGO_ENABLED=1 go build -o ./bin/web-app-caa ./cmd/web-app-caa
```

### ✅ 2. Updated Makefile
```makefile
# In Makefile
build:
	CGO_ENABLED=1 $(GOBUILD) -o $(BINARY_PATH) ./cmd/web-app-caa

build-nocgo:
	CGO_ENABLED=0 $(GOBUILD) -o $(BINARY_PATH) ./cmd/web-app-caa
```

### ✅ 3. GitHub Actions Configuration
```yaml
# In .github/workflows/build-container.yml
- name: Test build with CGO_ENABLED=1 (SQLite support)
  run: |
    export CGO_ENABLED=1
    go build -v -o web-app-caa-test ./cmd/web-app-caa

- name: Test CGO_ENABLED=1 issue workaround with Task
  run: |
    export CGO_ENABLED=0  # Set conflicting environment
    task build            # Should still work with workaround
```

## Files Modified/Created
- ✅ `Taskfile.yml` - New task runner configuration with CGO workarounds
- ✅ `Makefile` - Updated with explicit CGO settings  
- ✅ `.github/workflows/build-container.yml` - Updated workflow with CGO handling and testing
- ✅ `docs/development/cgo-issue.md` - Detailed documentation
- ✅ `docs/development/setup.md` - Updated with CGO reference
- ✅ `README.md` - Added CGO prerequisites and reference
- ❌ `.github/workflows/build-test.yml` - Deleted (consolidated into build-container.yml)

## Testing Verification
```bash
# Test the fix
export CGO_ENABLED=0  # Set conflicting environment
make build            # Should still work (uses CGO_ENABLED=1 in command)
task build            # Should still work (uses direct command setting)
```

## Key Takeaways
1. **Always set `CGO_ENABLED` directly in commands** when using go-task
2. **Install proper build dependencies** (gcc, musl-dev, etc.) in CI/CD
3. **Document CGO requirements** for projects using SQLite or other CGO dependencies
4. **Test both CGO-enabled and CGO-disabled builds** when applicable

This fix ensures reliable builds regardless of shell environment variable settings.
