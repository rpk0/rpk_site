require "stringex"
require "thor"

class Post < Thor
  desc "new TITLE", "Create a new post"

  method_option :date, aliases: "-d",
                       default: Time.now.strftime('%Y-%m-%d'),
                       desc: "Change the current time to the value provided"
  method_option :category, aliases: "-c",
                           default: "General",
                           type: :string,
                           desc: "Add the post's category"
  method_option :tags, aliases: "-t",
                       type: :string,
                       desc: "Add post tags, comma-separated string"

  def new(*title)
    title = title.join(" ")
    category = options[:category]
    # fomat tags in the way you want them to be displayed
    tags = [options[:tags].gsub(/\W+/, " - ")] if options[:tags]
    filename = "../_posts/#{category.downcase}/#{options[:date]}-#{title.to_url}.md"

    if File.exist?(filename)
      abort("#{filename} already exists!")
    end

    puts "Creating new post: #{filename}"
    open(filename, 'w') do |post|
      post.puts "---"
      post.puts "layout: post_layout"
      post.puts "title: \"#{title.gsub(/&/,'&amp;')}\""
      post.puts "avatar:"
      post.puts "category: #{category}"
      post.puts "tags: #{tags}"
      post.puts "path: posts"
      post.puts "---"
    end

    # open the md file in your default editor
    system ("#{ENV['EDITOR']} #{filename}")

    puts "New post created: #{filename}"
  end
end
