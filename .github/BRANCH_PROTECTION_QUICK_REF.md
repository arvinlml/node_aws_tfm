# Branch Protection Quick Reference

## 🚀 Quick Setup

### Option 1: Probot Settings App (Best)

```bash
# 1. Install: https://github.com/apps/settings
# 2. Select repository
# 3. Done! Rules apply automatically
```

### Option 2: GitHub Actions

```bash
# Trigger workflow
gh workflow run configure-branch-protection.yml -r main
```

### Option 3: Shell Scripts

```bash
# Setup protection
bash .github/scripts/setup-branch-protection.sh

# View current rules
bash .github/scripts/view-branch-protection.sh main

# Remove protection (caution!)
bash .github/scripts/remove-branch-protection.sh develop
```

---

## 📋 Protected Branches

| Branch    | Type        | Reviews    | Required Checks | Force Push |
| --------- | ----------- | ---------- | --------------- | ---------- |
| `main`    | Production  | 1 approval | 5 checks\*      | ❌ No      |
| `develop` | Development | 1 approval | 4 checks\*      | ❌ No      |

\*See "Status Checks" section below

---

## ✅ Status Checks

### Main Branch

```
✓ test (18.x)
✓ test (20.x)
✓ lint
✓ type-check
✓ coverage
```

### Develop Branch

```
✓ test (18.x)
✓ test (20.x)
✓ lint
✓ type-check
```

---

## 🔧 Common Tasks

### View Rules

```bash
# View all branches
bash .github/scripts/view-branch-protection.sh

# View specific branch
bash .github/scripts/view-branch-protection.sh main
gh api repos/owner/repo/branches/main/protection
```

### Update Rules

```bash
# Edit configuration
nano .github/settings.yml

# Commit and push
git add .github/settings.yml
git commit -m "docs: update branch protection rules"
git push

# App applies changes automatically
```

### Temporarily Disable (Development Only)

```bash
# Remove protection
bash .github/scripts/remove-branch-protection.sh develop

# Re-add protection when done
bash .github/scripts/setup-branch-protection.sh --develop
```

---

## 📚 Files Overview

```
.github/
├── settings.yml                    # Declarative config (Probot)
├── workflows/
│   ├── ci.yml                      # Defines status checks
│   └── configure-branch-protection.yml  # GitHub Actions setup
├── scripts/
│   ├── setup-branch-protection.sh    # Manual setup
│   ├── view-branch-protection.sh     # View rules
│   └── remove-branch-protection.sh   # Remove rules
└── CODEOWNERS                      # Auto-assign reviewers

BRANCH_PROTECTION.md                # Full documentation
```

---

## 🎯 Pull Request Workflow

```
1. Create feature branch
   git checkout -b feature/something

2. Make changes
   git add .
   git commit -m "add feature"

3. Push and create PR
   git push origin feature/something
   # Create PR on GitHub

4. Checks Run Automatically
   ✓ Tests (Node 18.x, 20.x)
   ✓ Linting
   ✓ Type checking
   ✓ Coverage (main only)

5. Get Approval
   - At least 1 review required
   - Can be your own approval

6. Merge
   - Green checkmark appears
   - Click "Squash and merge"
   - Branch auto-deleted
```

---

## ⚙️ Configuration

### Add New Status Check

```yaml
# .github/settings.yml
branches:
  - name: main
    protection:
      required_status_checks:
        contexts:
          - "new-check-name" # Add here
```

### Require More Reviews

```yaml
required_pull_request_reviews:
  required_approving_review_count: 2 # Change to 2
```

### Allow Force Pushes (Caution!)

```yaml
allow_force_pushes: true # Default: false
```

---

## 🐛 Troubleshooting

### "Required status check not found"

- **Issue**: Status check name doesn't match
- **Fix**: Check `.github/workflows/ci.yml` for exact check names

### "Branch protection not applied"

- **Issue**: Probot Settings app not installed
- **Fix**: Install app https://github.com/apps/settings

### "Can't push to protected branch"

- **Expected**: Create PR instead
- **Bypass**: Open PR, get approval, pass checks, then merge

### "Stale reviews not being dismissed"

- **Issue**: dismiss_stale_reviews not set
- **Fix**: Ensure settings.yml has `dismiss_stale_reviews: true`

---

## 📖 Learn More

- [GitHub Docs - Branch Protection](https://docs.github.com/en/github/administering-a-repository/managing-a-branch-protection-rule)
- [Probot Settings](https://github.com/apps/settings)
- [GitHub CLI](https://cli.github.com/)
- Full guide: See `BRANCH_PROTECTION.md`

---

## 💡 Tips

- **Use `.github/settings.yml`** for best experience
- **Keep config in git** for auditability
- **Review PRs promptly** to unblock development
- **Run checks locally** before pushing (`npm test`, `npm run lint`)
- **Update scripts** when protection rules change

---

## 🔐 Security Notes

- Prevent accidental code to `main`
- Enforce code review on all changes
- Require passing tests before merge
- Auto-dismiss stale reviews
- No force pushes allowed
