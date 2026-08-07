# frozen_string_literal: true

# Adds loading="lazy" and decoding="async" to images that Markdown generates.
#
# Gallery images get these from _includes/gallery.html, but kramdown emits a
# bare <img> for every `![alt](src)` in a post, and some posts carry a dozen.
# Anything that already declares `loading` is left alone, so an explicit
# loading="eager" in hand-written HTML still wins.
#
# This runs as a local plugin, which only works because the site builds through
# GitHub Actions rather than the legacy Pages pipeline.
Jekyll::Hooks.register [:posts, :documents, :pages], :post_render do |doc|
  next unless doc.output_ext == '.html'
  next if doc.output.nil?

  doc.output = doc.output.gsub(/<img\b(?![^>]*\bloading=)([^>]*)>/) do
    attrs = Regexp.last_match(1)
    extra = +' loading="lazy"'
    extra << ' decoding="async"' unless attrs.include?('decoding=')
    "<img#{attrs}#{extra}>"
  end
end
