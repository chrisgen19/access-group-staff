#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bun run wt:rm <branch-or-slug>
# Example:
#   bun run wt:rm feature/new-thing
#   bun run wt:rm feature-new-thing

if [[ $# -lt 1 ]]; then
  echo "Usage: bun run wt:rm <branch-or-slug>" >&2
  exit 1
fi

INPUT="$1"
SLUG="${INPUT//\//-}"

REPO_ROOT="$(git rev-parse --show-toplevel)"
REPO_NAME="$(basename "$REPO_ROOT")"
WT_DIR="$(dirname "$REPO_ROOT")/${REPO_NAME}.worktrees/$SLUG"

if [[ ! -d "$WT_DIR" ]]; then
  echo "No worktree at: $WT_DIR" >&2
  git -C "$REPO_ROOT" worktree list
  exit 1
fi

git -C "$REPO_ROOT" worktree remove "$WT_DIR"
echo "Removed $WT_DIR"
echo ""
echo "Branch still exists locally. Delete it with:"
echo "  git branch -d $INPUT   # or -D to force"
