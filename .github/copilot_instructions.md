# Copilot Instructions for `rpk_site`

## Project Overview
- Static photography portfolio, Jekyll 4, deployed to GitHub Pages by GitHub Actions (`.github/workflows/pages.yml`) on push to `gh-pages`.
- **Not** the legacy Pages build. The `github-pages` gem is gone, so any plugin and any Jekyll version is fair game.
- Local runtime: Ruby 3.3.6 via mise/rbenv. Output goes to `_site/`, which stays untracked.

## Local Environment
1. `bundle install`
2. `bundle exec jekyll serve --watch --port 4000 --livereload`
3. Preview at `http://127.0.0.1:4000`

## Content & Structure

| What | Where |
| --- | --- |
| Blog posts | `_posts/<category>/YYYY-MM-DD-title.md` |
| Photo essays | `_photo_essays/<slug>.html` (a Jekyll collection) |
| Photo essay assets | `uploads/<slug>/` |
| Projects | `projects/<slug>/index.html` |
| Critiq sessions | `critiq/<session>/` (generated, private) |
| Shared markup | `_includes/`, layouts in `_layouts/` |
| Styles | `css/base.css` |
| Scripts | `js/` |

### Adding a photo essay
Create `_photo_essays/<slug>.html`. The index page, the home carousel and the
next/prev links all derive from the collection, so this is the only file to touch.

```yaml
---
title: Essay Title
subtitle: Summer 2019        # shown on the card
order: 3                     # display order, lower is newer
thumb: /images/photo_listing/<slug>.jpg
dir: /uploads/<slug>         # base path for `images`
image: /uploads/<slug>/1.jpg # social card
description: One or two sentences, also used as the intro quote.
date_label: Aug 2019         # byline; all four are optional
location: Ioannina
camera: Mamiya 7
film: Kodak Portra 400
images:
  - 1.jpg
  - 2.jpg
---

{% include gallery.html %}
```

Then `ruby tools/build_images.rb` and commit both the `.jpg` and the `.webp`.

## Images

`tools/build_images.rb` is the only image step. It is idempotent, run it after
adding any photo:

- writes a sibling `.webp` for every jpg/png in `uploads/ images/ projects/ critiq/`
- regenerates `_data/image_sizes.yml`, which templates read to emit `width`/`height`

Originals are never modified. `_includes/gallery.html` and
`_includes/essay_card.html` consume both, so galleries get `<picture>`, WebP,
lazy loading and no layout shift for free. Never hand-write an `<img>` in a
gallery; use the include.

## Conventions

- **`path:` is reserved.** Jekyll 4 keys its Liquid template cache on `page.path`.
  Two pages declaring the same `path:` in front matter silently render each
  other's content. Use `section:` for navigation grouping instead.
- Icons are inline SVG via `{% include icon.html name="camera" %}`. There is no
  icon font. Add new glyphs to `_includes/icon.html`.
- Fonts are self-hosted Selawik Light/Bold (woff2) in `fonts/`. No Google Fonts.
  Selawik is Microsoft's SIL OFL font that is metrically compatible with Segoe
  UI, which the site ran on for years, so it sets identically without shipping a
  proprietary 2.6MB webfont. Licence in `fonts/Selawik-LICENSE.txt`. Weights are
  300 and 700 only; use `--fw-display` / `--fw-body` / `--fw-bold`.
- Meta tags come from `jekyll-seo-tag`. Do not hand-roll `og:`/`twitter:` tags.
  Set `title`, `description` and `image` in front matter and it follows.
- Sitemap (`jekyll-sitemap`) and feed (`jekyll-feed`) are generated. There are no
  checked-in `sitemap.xml` / `atom.xml`.
- CSS uses custom properties from the `:root` block in `css/base.css`. Use the
  tokens, do not add new hex values or breakpoints. Two breakpoints exist: 960px
  and 640px.
- **Whitespace:** no trailing whitespace, no spaces on blank lines.

## Critiq (private client review pages)

Firebase-backed photo voting under `/critiq/`. Sessions are `noindex` and
disallowed in `robots.txt`.

```bash
ruby create_critiq_session.rb <session-name> <photos-folder>  # local images
ruby create_external_session.rb <session-name> <urls-file>    # external URLs
ruby delete_critiq_session.rb                                 # interactive removal
```

`create_critiq_session.rb` runs `tools/build_images.rb` automatically.

**Known limitation:** the Realtime Database is world-readable and the admin PIN
is a client-side SHA-1 hash embedded in `critiq/admin.html`. Anyone with the URL
can read every session over the REST API. Treat critiq as obscure, not private,
until the rules are moved behind Firebase Auth.

- Layout: `_layouts/critiq_layout.html`
- Logic: `js/firebase-voting.js`
- Admin: `critiq/admin.html`
- Vote shape: `{vote, voterName, comment, timestamp}`

## Deployment
- Push to `gh-pages`; the Actions workflow builds and deploys.
- Pages source must be set to **GitHub Actions** in repo settings (Settings →
  Pages → Build and deployment → Source).
- Run `bundle exec jekyll build` locally before pushing to catch template errors.

## Commits
- Title max 50 chars, imperative, then a blank line
- Body wrapped at 80 chars, explains WHY
- One logical change per commit
