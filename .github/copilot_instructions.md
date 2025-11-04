# Copilot Instructions for `rpk_site`

## Project Overview
- Static photography portfolio powered by Jekyll and deployed via GitHub Pages from the `gh-pages` branch.
- Local runtime uses Ruby 3.3.6 (`.ruby-version`) with Bundler and the `github-pages` gem to mirror production.
- Generated output goes to `_site/` and must remain untracked.

## Local Environment Checklist
1. `rbenv install 3.3.6` (or ensure Ruby 3.3.6 available).
2. From repo root run `bundle install`.
3. Start the dev server with `bundle exec jekyll serve --watch --port 4000 --livereload`.
4. Preview at `http://127.0.0.1:4000` (prefer over `localhost`).

## Content & Structure
- Blog posts live in `_posts/<category>/YYYY-MM-DD-title.md`.
- Photo essays are under `photo_essays/<slug>/index.html` with assets in `uploads/<slug>/`.
- Shared HTML lives in `_includes/`; layouts in `_layouts/`. Reuse existing patterns.
- CSS resides in `css/`; JavaScript helpers in `js/`. Keep assets optimized for load speed.

## Development Guidelines
- Favor incremental changes; add comments only when absolutely necessary for clarity.
- Do not commit `_site/` or local scratch files (e.g., `AGENT_GUIDE.md`).
- When introducing gems or plugins, ensure compatibility with the `github-pages` gem set.
- Respect existing typography/spacing to keep layouts consistent across galleries.

## Deployment Notes
- GitHub Pages handles builds; avoid workflow files that conflict with the default deploy pipeline.
- Run `bundle exec jekyll build` locally before large changes to catch template errors.

## Communication Tips for Agents
- Mention any manual steps (image optimization, data preparation) in PR descriptions.
- Highlight layout-impacting changes for easier review.
- When unsure about design decisions, propose options rather than unilateral changes.
- For Commits respect the following: 
  - Title line: Maximum 50 characters, followed by a blank line
  - Description: Wrapped at 80 characters per line
  - One commit = one logical change - Keep commits small and focused
  - If the commit is small enough, the "what" should be evident from the code
  - Focus on explaining WHY the change was made
  - Provide enough context for reviewers and future developers
