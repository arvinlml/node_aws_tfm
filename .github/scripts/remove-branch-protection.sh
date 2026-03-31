#!/bin/bash
#
# Remove Branch Protection Rules (for development/testing)
#
# ⚠️  WARNING: This script removes all branch protection rules from the specified branch.
#    Use with caution in production repositories.
#
# Usage:
#   bash .github/scripts/remove-branch-protection.sh main
#   bash .github/scripts/remove-branch-protection.sh develop
#

set -e

if [ -z "$1" ]; then
  echo "❌ Branch name required"
  echo "Usage: bash .github/scripts/remove-branch-protection.sh <branch>"
  echo "Example: bash .github/scripts/remove-branch-protection.sh develop"
  exit 1
fi

BRANCH=$1
REPO=$(gh repo view --json nameWithOwner --query nameWithOwner)

echo "⚠️  Are you sure you want to remove protection from branch '$BRANCH'?"
echo "📦 Repository: $REPO"
read -p "Type 'yes' to confirm: " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Cancelled"
  exit 0
fi

echo "🗑️  Removing branch protection from: $BRANCH"
gh api -X DELETE repos/$REPO/branches/$BRANCH/protection

echo "✅ Branch protection removed successfully"
echo ""
echo "💡 To re-add protection, run:"
echo "   bash .github/scripts/setup-branch-protection.sh --$BRANCH"
