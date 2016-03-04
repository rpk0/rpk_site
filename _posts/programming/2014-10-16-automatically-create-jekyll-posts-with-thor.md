---
layout: post_layout
title: "Automatically create Jekyll posts with Thor"
avatar: http://png-4.findicons.com/files/icons/2770/ios_7_icons/512/thor_hammer.png
category: Programming
tags: [Programming - Jekyll - Thor - Ruby - Automation]
path: posts
---

**The Problem**

Jekyll is a simple, blog-aware, static site generator so it tracks posts and publication dates to produce the static content.

*The naming convention for post files is important, and must follow the 
format:  
`YEAR-MONTH-DAY-title.MARKUP`*

So each time you create a new post you have to follow these convention. 
In addition to this every post has a `YAML front matter block` which is processed by Jekyll and contains predefined and custom variables.

Hence we have to automate these two things:

1. the creation of the file with the correct name
2. the *YAML front matter block*

**The solution**

I chose [Thor](https://whatisthor.com/) for this job as it is a very simple but powerful tool.

In my research I have rejected two other solutions

- a simple Rake task
- a simple [ruby script](https://gist.github.com/rpk0/7ef3ba85bff2fbbba342) with [Slop Gem](https://github.com/leejarvis/slop) (lightweight option parsing)

if you have a Gemfile add the following gems 

```
gem 'thor'
gem 'stringex'
```

and run `bundle isntall`

if you do not have a gemfile just (`sudo if required`) install the two gems

```
gem install thor
gem install stringex
```

Now create a `post.thor` file in the root directory of the your Jekyll project with the following contents:

```ruby
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
                           desc: "Add the post's category, default 'General'"
  method_option :tags, aliases: "-t",
                       type: :string,
                       desc: "Add post tags, comma-separated string"

  def new(*title)
    title = title.join(" ")
    category = options[:category]
    # fomat tags in the way you want them to be displayed
    tags = options[:tags].gsub(/\W+/, " - ") if options[:tags]
    filename = "_posts/#{category.downcase}/#{options[:date]}-#{title.to_url}.md"

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

    # opens the md file in your default editor
    system ("#{ENV['EDITOR']} #{filename}")

    puts "New post created: #{filename}"
  end
end
```

Once you have this created, you can run `thor list` from the command line and you should see the following output:

```
post
----
thor post:new TITLE  # Create a new post
```

In this example, the `method_options` have been supplied with several parameters.  
The first parameter is the full name of the option, this is translated into a -- option on the command line.  
The second is the alias option to provide a short version of this option.  
The last one is the `desc` parameter which adds a description for the option,when printing out the full usage for a command.  
for example: 

If you run `thor post:help new` you should see the following output:

```
Usage:
  thor post:new TITLE

Options:
  -d, [--date=DATE]          # Change the current time to the value provided
                             # Default: 2014-10-16 *the current date*
  -c, [--category=CATEGORY]  # Add the post's category
                             # Default: General
  -t, [--tags=TAGS]          # Add post tags, comma-separated string

Create a new post
```

So that command to generate this post was:

```
thor post:new Automatically create jekyll posts with Thor -c Programming -t "Programming, Jekyll, Thor, Ruby, Automation"
```

which creates the file `_posts/2014-10-16-automatically-create-jekyll-posts-with-thor.md` and opens it in your default editor (`printenv | grep EDITOR`).

**Optional**

You can create an executable file in the current directory and start the simple CLI with a call to `Post.start(ARGV)`

```
#!/usr/bin/env ruby
require './post'

trap('SIGINT') do
  puts "\nInterrupt received exiting..."
  exit
end

Post.start(ARGV)
```

In this configuration, which can be useful in some cases
you have to change the main script to `.rb`

To execute the post task you have to run 
`ruby create_post new TITLE, [Options]`

**Future work**

In a future post I'll be writing how I have automated the photo essay posts generation which are not markdown files but complex HTML files. 
  
<sup>*references: https://jonasforsberg.se/2012/12/28/create-jekyll-posts-from-the-command-line*</sup>
