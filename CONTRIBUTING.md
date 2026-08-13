# Contributing to nestify

Thank you for your interest in contributing to nestify!

## How to Contribute

We welcome contributions through Pull Requests. Here are the guidelines:

### Code Reviews

All submissions require review. We use GitHub pull requests for this purpose.

### Changelog Policy

Every user-facing change must be reflected in [CHANGELOG.md](./CHANGELOG.md):

1. Add an entry under `[Unreleased]` in the appropriate category (`Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`).
2. Use the [Keep a Changelog](https://keepachangelog.com/) format and write entries from the user's perspective.
3. Reference the related issue or pull request number when available.
4. When cutting a release, move the `[Unreleased]` entries into a new dated section matching the released version and update the compare links at the bottom of the file.

Pull requests that change user-facing behavior are expected to update `CHANGELOG.md`. A CI check (`Changelog Check`) validates the file's format on every pull request.

### Development Setup

When working on nestify, you should:

1. Fork the project
2. Clone your forked repository
3. Make sure you have Node.js installed (version requirements TBD)
4. Install dependencies and link globally:

```bash
git clone <your_forked_repo>
cd nestify
npm install
npm link
npm test
```
