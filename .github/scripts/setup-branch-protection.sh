#!/bin/bash
#
# Configure Branch Protection Rules for GitHub Repository
# 
# Prerequisites:
#   - GitHub CLI installed and authenticated: gh auth login
#   - Owner/admin access to the repository
#
# Usage:
#   bash .github/scripts/setup-branch-protection.sh
#   bash .github/scripts/setup-branch-protection.sh --main
#   bash .github/scripts/setup-branch-protection.sh --develop
#

set -e

REPO=$(gh repo view --json nameWithOwner --query nameWithOwner)
BRANCH="${1:-all}"

echo "🔒 Configuring Branch Protection Rules"
echo "📦 Repository: $REPO"
echo ""

# Function to protect a branch
protect_branch() {
  local branch=$1
  local contexts=$2
  local require_reviews=${3:-true}
  
  echo "🛡️  Protecting branch: $branch"
  
  if [ "$require_reviews" = true ]; then
    gh api repos/$REPO/branches/$branch/protection \
      --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": $contexts
  },
  "required_pull_request_reviews": {
    "dismissal_restrictions": {},
    "require_code_owner_reviews": false,
    "require_last_push_approval": false,
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true
  },
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "require_signed_commits": false,
  "enforce_admins": false
}
EOF
  else
    gh api repos/$REPO/branches/$branch/protection \
      --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": $contexts
  },
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "require_signed_commits": false,
  "enforce_admins": false
}
EOF
  fi
  
  echo "✅ Branch '$branch' protected successfully"
  echo ""
}

# Main branch - requires all checks + 1 approval
if [[ "$BRANCH" == "all" && "$BRANCH" != "--main" ]] || [[ "$BRANCH" == "--main" ]]; then
  protect_branch "main" '["test (18.x)", "test (20.x)", "lint", "type-check", "coverage"]' true
fi

# Develop branch - requires most checks + 1 approval
if [[ "$BRANCH" == "all" && "$BRANCH" != "--develop" ]] || [[ "$BRANCH" == "--develop" ]]; then
  protect_branch "develop" '["test (18.x)", "test (20.x)", "lint", "type-check"]' true
fi

if [[ "$BRANCH" == "all" ]]; then
  echo "🎉 All branch protection rules configured!"
  echo ""
  echo "📋 Configuration Summary:"
  echo "┌─ main"
  echo "│  ├─ Requires 1 approval"
  echo "│  ├─ Requires all status checks to pass"
  echo "│  ├─ Requires branch to be up to date"
  echo "│  ├─ Dismiss stale reviews"
  echo "│  └─ No force pushes or deletions allowed"
  echo "└─ develop"
  echo "   ├─ Requires 1 approval"
  echo "   ├─ Requires status checks to pass"
  echo "   ├─ Requires branch to be up to date"
  echo "   ├─ Dismiss stale reviews"
  echo "   └─ No force pushes or deletions allowed"
  echo ""
  echo "💡 To verify rules, run:"
  echo "   gh api repos/$REPO/branches/main/protection"
  echo "   gh api repos/$REPO/branches/develop/protection"
fi
