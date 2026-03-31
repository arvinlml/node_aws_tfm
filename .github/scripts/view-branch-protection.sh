#!/bin/bash
#
# View Current Branch Protection Rules
#
# Usage:
#   bash .github/scripts/view-branch-protection.sh
#   bash .github/scripts/view-branch-protection.sh main
#   bash .github/scripts/view-branch-protection.sh develop
#

REPO=$(gh repo view --json nameWithOwner --query nameWithOwner)
BRANCH="${1:-all}"

echo "🔍 Viewing Branch Protection Rules"
echo "📦 Repository: $REPO"
echo ""

if [[ "$BRANCH" == "all" || "$BRANCH" == "main" ]]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🛡️  Branch: main"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  gh api repos/$REPO/branches/main/protection --jq . || echo "❌ No protection configured"
  echo ""
fi

if [[ "$BRANCH" == "all" || "$BRANCH" == "develop" ]]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🛡️  Branch: develop"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  gh api repos/$REPO/branches/develop/protection --jq . || echo "❌ No protection configured"
  echo ""
fi
