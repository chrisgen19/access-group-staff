#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bun run wt:new <branch> [base]
# Examples:
#   bun run wt:new feature/new-thing
#   bun run wt:new bugfix/47-auth-redirect-loop origin/main

if [[ $# -lt 1 ]]; then
  echo "Usage: bun run wt:new <branch> [base-ref]" >&2
  exit 1
fi

BRANCH="$1"
BASE="${2:-origin/main}"
SLUG="${BRANCH//\//-}"

REPO_ROOT="$(git rev-parse --show-toplevel)"
REPO_NAME="$(basename "$REPO_ROOT")"
WT_PARENT="$(dirname "$REPO_ROOT")/${REPO_NAME}.worktrees"
WT_DIR="$WT_PARENT/$SLUG"
PORT_FILE="$WT_PARENT/.next-port"

mkdir -p "$WT_PARENT"

if [[ -e "$WT_DIR" ]]; then
  echo "Worktree path already exists: $WT_DIR" >&2
  exit 1
fi

git -C "$REPO_ROOT" fetch origin --prune

if git -C "$REPO_ROOT" show-ref --verify --quiet "refs/heads/$BRANCH"; then
  git -C "$REPO_ROOT" worktree add "$WT_DIR" "$BRANCH"
elif git -C "$REPO_ROOT" ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
  git -C "$REPO_ROOT" worktree add "$WT_DIR" -b "$BRANCH" "origin/$BRANCH"
else
  git -C "$REPO_ROOT" worktree add "$WT_DIR" -b "$BRANCH" "$BASE"
fi

for f in .env .env.local; do
  if [[ -f "$REPO_ROOT/$f" ]]; then
    ln -s "$REPO_ROOT/$f" "$WT_DIR/$f"
    echo "linked $f"
  fi
done

if [[ -f "$PORT_FILE" ]]; then
  PORT=$(( $(cat "$PORT_FILE") + 1 ))
else
  PORT=3001
fi
echo "$PORT" > "$PORT_FILE"

echo ""
echo "Worktree ready: $WT_DIR"
echo "Suggested dev port: $PORT"
echo ""
echo "Next steps:"
echo "  cd $WT_DIR"
echo "  bun install"
echo "  bun dev --port $PORT"
