# Contributing & Version Control Guide

This repository follows a strict Git branching model and Conventional Commits workflow designed for institutional assessment and production software standards.

---

## 1. Branch Hierarchy

```text
main (Protected, Production releases only, tagged vX.Y.Z)
  └── develop (Integration branch for finished features)
        ├── feature/project-setup
        ├── feature/database-schema
        ├── feature/auth
        ├── feature/apartments-api
        ├── feature/ui-design-system
        ├── feature/home-and-content-pages
        ├── feature/apartment-listing-detail
        ├── feature/booking-engine
        ├── feature/paystack-payments
        ├── feature/user-dashboard
        ├── feature/admin-dashboard
        ├── feature/reviews-contact
        ├── feature/testing-polish
        └── release/v1.0.0
```

* **`main`**: Reflects production code deployed to Vercel (Frontend) and Render/Railway (Backend).
* **`develop`**: The integration branch where all feature PRs land after testing.
* **`feature/*`**: Isolated feature branches branched off `develop` and merged back into `develop` with `--no-ff`.
* **`release/*`**: Preparation branch for version bumps, tagging, and deployment documentation.

---

## 2. Conventional Commit Standards

Every commit message must follow the Conventional Commits specification:

```text
<type>(<scope>): <short description in imperative mood>

[optional body explaining 'why' and architectural rationale]
```

### Allowed Types:
* `feat`: A new feature (e.g. `feat(auth): implement JWT httpOnly cookie authentication`)
* `fix`: A bug fix (e.g. `fix(booking): prevent checkout when dates overlap`)
* `docs`: Documentation only (e.g. `docs(design): define typography and color tokens`)
* `chore`: Build tasks, package updates, setup (e.g. `chore(deps): configure Prisma and Express`)
* `test`: Adding or refactoring tests (e.g. `test(booking): test date overlap collision prevention`)
* `refactor`: Code change that neither fixes a bug nor adds a feature

---

## 3. Step-by-Step Command Guide for Feature Workflow

### Starting a New Feature
```bash
# Ensure develop is clean and up to date
git checkout develop
git pull origin develop

# Create your feature branch
git checkout -b feature/<feature-name>
```

### Staging and Committing
```bash
# Stage changed files
git add <path/to/files>

# Commit with a conventional message
git commit -m "feat(<scope>): description of change"
```

### Merging Feature into Develop
```bash
# Switch to develop
git checkout develop

# Merge using non-fast-forward so the feature boundary is preserved in git graph
git merge --no-ff feature/<feature-name> -m "Merge pull request from feature/<feature-name>"

# Delete feature branch after merge (optional or keep for audit)
git branch -d feature/<feature-name>
```

---

## 4. Visualizing Branch History for Assessment

Run the following command to display a compact, colored branch graph showing all branches, merges, and conventional commits:

```bash
git log --graph --oneline --decorate --all
```

Or for a formatted view with author and date:

```bash
git log --graph --pretty=format:'%C(yellow)%h%Creset -%C(red)%d%Creset %s %C(green)(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit --all
```
