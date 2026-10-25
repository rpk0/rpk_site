# rpk.io

Photography portfolio of Kostis Karampinas, live at [rpk.io](https://rpk.io).
Jekyll 4 on GitHub Pages, behind Cloudflare.

## Run locally

Ruby comes from [mise](https://mise.jdx.dev) (`.mise.toml`).

```sh
bundle install
bundle exec jekyll serve --livereload
```

Then open http://127.0.0.1:4000.

## Adding photos

Reference the original `.jpg`/`.png` everywhere, then run:

```sh
ruby tools/build_images.rb
```

It writes the `.webp` siblings and image sizes the build serves. Commit both.

## Deploy

Push to `gh-pages`. GitHub Actions builds and deploys
(`.github/workflows/pages.yml`).

## More

Structure, conventions, caching and CSP rules live in
[`.github/copilot-instructions.md`](.github/copilot-instructions.md).

Code is MIT licensed, see [LICENSE](LICENSE).
