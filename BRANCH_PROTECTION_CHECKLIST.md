# Branch Protection Setup Checklist

Complete this checklist to enable branch protection rules for your repository.

## 🔧 Initial Setup (Choose One Method)

### Method 1: Probot Settings App (Recommended ⭐)

- [ ] Go to https://github.com/apps/settings
- [ ] Click "Install" button
- [ ] Select your repository (`arvinlml/node_aws_tfm`)
- [ ] Authorize the app
- [ ] Verify rules applied (give it 1-2 minutes)
  ```bash
  bash .github/scripts/view-branch-protection.sh
  ```
- [ ] Done! App will auto-update rules when `.github/settings.yml` changes

**Advantages:**

- Most elegant solution
- Fully version-controlled
- Automatic updates
- No manual work needed

### Method 2: GitHub Actions Workflow

- [ ] Go to "Actions" tab in your repository
- [ ] Select "Configure Branch Protection" workflow
- [ ] Click "Run workflow" button
- [ ] Select branch: `main`
- [ ] Verify rules applied
  ```bash
  bash .github/scripts/view-branch-protection.sh
  ```

**Advantages:**

- No external app needed
- Auditable via Actions logs
- Can be triggered on demand

### Method 3: GitHub CLI Scripts (Manual)

- [ ] Install GitHub CLI: `brew install gh`
- [ ] Authenticate: `gh auth login`
- [ ] Run setup script:
  ```bash
  bash .github/scripts/setup-branch-protection.sh
  ```
- [ ] Verify rules applied:
  ```bash
  bash .github/scripts/view-branch-protection.sh
  ```

**Advantages:**

- Full control
- No dependencies
- Good for automation

---

## ✅ Verification

After setup, verify everything works:

### 1. Check Rules Applied

```bash
bash .github/scripts/view-branch-protection.sh
```

Expected output: JSON with protection rules for `main` and `develop`

### 2. Create Test PR

- [ ] Create feature branch: `git checkout -b test/branch-protection`
- [ ] Make a change: `echo "test" >> README.md`
- [ ] Commit: `git add . && git commit -m "test"`
- [ ] Push: `git push origin test/branch-protection`
- [ ] Create PR on GitHub

### 3. Verify Checks Run

- [ ] GitHub Actions workflow starts
- [ ] See jobs running:
  - lint ✓
  - type-check ✓
  - test (18.x) ✓
  - test (20.x) ✓
- [ ] PR shows status checks at bottom
- [ ] All checks complete (green or red)

### 4. Verify Merge Requirements

- [ ] Try to merge without approval → **Blocked** ✓
- [ ] Get 1 approval from reviewer
- [ ] "Squash and merge" button becomes enabled
- [ ] Merge PR
- [ ] Branch auto-deleted ✓

---

## 🔄 Updating Rules

When you need to change protection rules:

### Using Probot Settings (Recommended)

```bash
# 1. Edit configuration
nano .github/settings.yml

# 2. Commit and push
git add .github/settings.yml
git commit -m "docs: update branch protection rules"
git push

# 3. App automatically applies changes (within 5 minutes)
bash .github/scripts/view-branch-protection.sh  # Verify
```

### Using Scripts (Manual)

```bash
# 1. Edit script
nano .github/scripts/setup-branch-protection.sh

# 2. Run script
bash .github/scripts/setup-branch-protection.sh

# 3. Verify
bash .github/scripts/view-branch-protection.sh
```

---

## 📋 Configuration Customization

### Require More Reviews (2+ instead of 1)

```yaml
# Edit .github/settings.yml
required_approving_review_count: 2
```

### Add New Status Check

```yaml
# Add to required_status_checks contexts
contexts:
  - "test (18.x)"
  - "test (20.x)"
  - "lint"
  - "type-check"
  - "coverage"
  - "security-scan" # ← Add here
```

### Allow Force Pushes (Not recommended!)

```yaml
allow_force_pushes: true # Default: false
```

### Require Signed Commits

```yaml
require_signed_commits: true # Default: false
```

---

## 🚀 Team Communication

After setup, communicate with your team:

### Share Documentation

- [ ] Share `BRANCH_PROTECTION_QUICK_REF.md` with team
- [ ] Share `BRANCH_PROTECTION.md` for detailed guide
- [ ] Add link to team wiki/documentation

### Team Meeting Talking Points

- "All PRs require: 1 approval + all checks passing"
- "Branch protection prevents accidents"
- "Stale reviews auto-dismissed when new commits pushed"
- "Branches auto-delete after merge"
- "Rules are version-controlled in `.github/settings.yml`"

### Example Team Message

```
🔒 Branch Protection Rules Enabled

We've implemented automated branch protection on main and develop:

✅ Requirements:
  - 1 code review approval
  - All status checks passing (lint, tests, type-check)
  - Branch up to date with base branch
  - No force pushes or direct deletions

📖 Quick Guide:
  See .github/BRANCH_PROTECTION_QUICK_REF.md

❓ Questions?
  See BRANCH_PROTECTION.md for detailed guide

💡 Benefits:
  - Prevents bugs from reaching production
  - Ensures code review
  - Maintains clean git history
  - Automated checks save time
```

---

## 🐛 Troubleshooting

### "Rules don't appear after setup"

- [ ] Wait 1-2 minutes for Probot to initialize
- [ ] Check Probot app is installed: `gh api repos/owner/repo/installations`
- [ ] Manually trigger: `bash .github/scripts/setup-branch-protection.sh`

### "Status checks not recognized"

- [ ] Check CI workflow job names: `grep "name:" .github/workflows/ci.yml`
- [ ] Compare with branch protection contexts in `settings.yml`
- [ ] Names must match exactly (case-sensitive!)

### "Cannot merge PR"

This is expected! To merge:

1. Get 1 reviewer approval with comment "Approved"
2. Wait for all checks to pass (green checkmarks)
3. Click "Squash and merge" or "Create merge commit"

### "Need to bypass temporarily"

⚠️ Only for development/testing:

```bash
bash .github/scripts/remove-branch-protection.sh develop
# Work...
bash .github/scripts/setup-branch-protection.sh --develop
```

---

## 📚 Files Reference

| File                                                | Purpose                           |
| --------------------------------------------------- | --------------------------------- |
| `.github/settings.yml`                              | Main configuration (Probot)       |
| `.github/workflows/ci.yml`                          | Updated with proper status checks |
| `.github/workflows/configure-branch-protection.yml` | Alternative setup workflow        |
| `.github/scripts/setup-branch-protection.sh`        | Manual setup script               |
| `.github/scripts/view-branch-protection.sh`         | View current rules                |
| `.github/scripts/remove-branch-protection.sh`       | Remove protection (emergency)     |
| `.github/CODEOWNERS`                                | Automatic reviewer assignment     |
| `BRANCH_PROTECTION.md`                              | Comprehensive documentation       |
| `BRANCH_PROTECTION_QUICK_REF.md`                    | Quick reference                   |
| `BRANCH_PROTECTION_SETUP.md`                        | Setup summary                     |

---

## ✨ Post-Setup Tasks

After confirming setup works:

### Team Setup

- [ ] Add team members to CODEOWNERS
- [ ] Share documentation with team
- [ ] Brief team on new workflow
- [ ] Update team guidelines/wiki

### Customization

- [ ] Adjust review count if needed
- [ ] Update CODEOWNERS with your team
- [ ] Add additional status checks if needed
- [ ] Enable signed commits if desired

### Maintenance

- [ ] Monitor first few PRs to ensure smooth workflow
- [ ] Adjust rules based on team feedback
- [ ] Keep `.github/settings.yml` updated
- [ ] Document any custom rules

### Automation

- [ ] Consider additional workflows for security
- [ ] Add CodeQL scanning
- [ ] Add dependency checking
- [ ] Add spell-checking for documentation

---

## 🎉 Success Indicators

You've successfully set up branch protection when:

- ✅ Both `main` and `develop` branches protected
- ✅ Test PR cannot be merged without approval
- ✅ All checks run automatically
- ✅ Branch auto-deletes after merge
- ✅ Stale reviews get dismissed
- ✅ Force pushes blocked
- ✅ Team can follow the workflow smoothly

---

## 📞 Help & Support

### For Issues

1. Check troubleshooting section above
2. Review `BRANCH_PROTECTION.md` for detailed guide
3. Run view script to check current state
4. Check GitHub Actions logs for errors

### For Questions

1. See "Quick Reference": `BRANCH_PROTECTION_QUICK_REF.md`
2. See "Full Guide": `BRANCH_PROTECTION.md`
3. See GitHub docs: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository

---

## 📝 Notes

- Date setup completed: ******\_\_\_******
- Method used: [ ] Probot [ ] GitHub Actions [ ] Scripts
- Team notified: [ ] Yes [ ] No
- Customizations made: ******\_\_\_******
- Issues encountered: ******\_\_\_******

---

**All done! Your branch protection is now active.** 🔒✨
