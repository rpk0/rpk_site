# frozen_string_literal: true

require 'digest'

# `{{ '/css/base.css' | asset }}` -> `/css/base.css?v=<8 chars of sha1>`
#
# rpk.io sits behind Cloudflare's cache. Hashing the file contents means the URL
# changes exactly when the file does, so CSS and JS can be cached for as long as
# the edge allows and an edit still reaches every visitor on the next deploy.
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
