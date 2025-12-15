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
- **Whitespace:** Do not leave trailing whitespace on lines. Ensure empty lines contain no spaces or tabs to avoid red diffs in GitHub.

## Deployment Notes
- GitHub Pages handles builds; avoid workflow files that conflict with the default deploy pipeline.
- Run `bundle exec jekyll build` locally before large changes to catch template errors.

## Communication Tips for Agents
- **Documentation:** Update this file (`.github/copilot_instructions.md`) whenever a new feature is implemented or an existing workflow changes.
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

## Recent Feature Implementations

### Lightbox System
Custom vanilla JS lightbox (`/js/lightbox-improved.js`) with touch/swipe support. Desktop: arrows beside image + click zones. Mobile: bottom-right navigation for one-handed use + swipe gestures. Uses hardware acceleration, image preloading, and SVG icons for optimal performance.

### Tag Filtering
Client-side post filtering (`/js/tag-filter.js`) compatible with GitHub Pages. Clickable tag badges in `/posts/` filter posts instantly. URL-shareable filters, browser history support, and tags index at `/tags/`. Each post has `data-tags` attribute for filtering logic.

### Firebase Voting System (Critiq)
Firebase-powered photo voting in `/critiq/` with 3-choice voting (😍 Like/😐 Ok/😞 Dislike), name tracking, real-time counts. Reuses standard photo layout with lightbox.

**Create Session (2 Methods):**

1. **Local Images:**
   ```bash
   ruby create_critiq_session.rb <session-name> <photos-folder>
   ```
   Copies photos to `critiq/<session-name>`, generates `index.html`.

2. **External Images (Dropbox/Drive):**
   ```bash
   ruby create_external_session.rb <session-name> <urls-file.txt>
   ```
   Uses a text file with one image URL per line. Does not download images; links directly to source.

**Manage Sessions:**
```bash
ruby delete_critiq_session.rb
```
Interactive CLI to remove local folders and **archive** Firebase data (soft delete).
- Requires Firebase Database Secret (prompted on first run, saved to `firebase_secret.key`).
- Archived sessions are hidden from the Admin UI but data is preserved.

**Key Files:**
- Layout: `_layouts/critiq_layout.html` (Firebase SDK, name modal, vote buttons under images, vote summary line)
- Logic: `js/firebase-voting.js` (sanitizes photo IDs, real-time listeners, comment support)
- Admin: `critiq/admin.html` (Thumbnails, sorting, filters out archived sessions)
- Vote structure: `{vote: "like/ok/dislike", voterName: string, comment: string, timestamp: number}`
- Firebase rules: Allow read at `/sessions`, validate vote structure with required fields
