# frozen_string_literal: true

# Photos are referenced by their original JPG/PNG path everywhere (front
# matter, Markdown, templates), but only the .webp sibling that
# tools/build_images.rb writes is served:
#
#   1. Every local src/href pointing at an original with a .webp sibling is
#      rewritten to the .webp.
#   2. Every <img> gets width/height from _data/image_sizes.yml when it has
#      none, and loading="lazy" decoding="async" unless it sets loading itself.
#   3. Originals are left out of the build, except the ones used as social
#      cards (`image:` front matter and the site logo), since crawlers still
#      expect JPG there.
module RpkImages
  ORIGINAL = %r{\A/(images|uploads|projects)/[^"]+\.(?:jpe?g|png)\z}i

  def self.webp_for(site, url)
    return unless url.match?(ORIGINAL)

    webp = url.sub(/\.\w+\z/, '.webp')
    webp if File.exist?(File.join(site.source, webp))
  end

  def self.img(site, attrs)
    src = attrs[/\bsrc="([^"]+)"/, 1]
    if src
      dims = site.data.dig('image_sizes', src)
      attrs << %( width="#{dims['w']}" height="#{dims['h']}") if dims && !attrs.include?('width=')
      webp = webp_for(site, src)
      attrs = attrs.sub(%(src="#{src}"), %(src="#{webp}")) if webp
    end
    unless attrs.include?('loading=')
      attrs << ' loading="lazy"'
      attrs << ' decoding="async"' unless attrs.include?('decoding=')
    end
    "<img#{attrs}>"
  end
end

Jekyll::Hooks.register :site, :post_read do |site|
  keep = (site.pages + site.documents).map { |d| d.data['image'] }
  keep << site.config['logo']
  site.static_files.reject! do |file|
    url = file.url
    !keep.include?(url) && RpkImages.webp_for(site, url)
  end
end

Jekyll::Hooks.register [:posts, :documents, :pages], :post_render do |doc|
  next unless %w[.html .xml].include?(doc.output_ext)
  next if doc.output.nil?

  site = doc.site
  html = doc.output.gsub(/<img\b([^>]*?)\s*\/?>/) { RpkImages.img(site, Regexp.last_match(1)) }
  doc.output = html.gsub(/\bhref="([^"]+)"/) do
    webp = RpkImages.webp_for(site, Regexp.last_match(1))
    webp ? %(href="#{webp}") : Regexp.last_match(0)
  end
end
