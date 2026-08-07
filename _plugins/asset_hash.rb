# frozen_string_literal: true

require 'digest'

# `{{ '/css/base.css' | asset }}` -> `/css/base.css?v=<8 chars of sha1>`
#
# rpk.io sits behind Cloudflare, which serves CSS and JS with a 16 day
# Cache-Control. Without a changing URL, a stylesheet edit stays invisible to
# returning visitors (and to the edge) for over two weeks. Hashing the file
# contents means the URL only changes when the file actually does, so unchanged
# assets keep their cache across deploys.
module Jekyll
  module AssetHashFilter
    CACHE = {}

    def asset(path)
      site = @context.registers[:site]
      key = path.to_s
      CACHE[key] ||= begin
        file = File.join(site.source, key.sub(%r{\A/}, ''))
        File.exist?(file) ? Digest::SHA1.file(file).hexdigest[0, 8] : nil
      end
      CACHE[key] ? "#{key}?v=#{CACHE[key]}" : key
    end
  end
end

Liquid::Template.register_filter(Jekyll::AssetHashFilter)

# Contents change between serve rebuilds, so never reuse a stale digest.
Jekyll::Hooks.register :site, :pre_render do
  Jekyll::AssetHashFilter::CACHE.clear
end
