---
layout: post_layout
title: "Automatically create HTML posts in Jekyll with Thor"
avatar: http://simpleicon.com/wp-content/uploads/gear.png
category: Programming
tags: [Programming - Jekyll - Thor - Ruby - Automation]
path: posts
---

## The Problem

<sup>This article is the sequel to the [the previous Thor automation tutorial](http://rpk.io/posts/automatically-create-jekyll-posts-with-thor/) posted some months ago.<sup>

In the photography section of this blog I post photo essays, a photo-essay (or photographic essay) is a set or series of photographs that are intended to tell a story or evoke a series of emotions in the viewer.

So it is very important to display the images in the best possible way.
Doing this is very difficult as the style varies from essay to essay 
and from device to device. 
Posts written in Markdown made it too difficult to customize the presentation so I decided to create manually the HTML files for each post.

This is **time consuming** and **repeatable** process so why not automate it too as we do with the blog posts?

For this task we have to work on three things

1. Dynamically generate the photo list with *Liquid templating language*
2. Choose where to upload the images 
3. Write a Thor script to generate the HTML file

## The Solution

### 1. We have to minimize and optimize the default HTML file of each photo essay

Each photo set is a list of, normally, more than 5 images, using liquid we can generate the huge HTML list with just a few lines of code.

```html
<ul>
  { % for img in page.images % }
    <li><a href="/uploads/--folder_name--/{{img}}" data-lightbox="image-1"><img src="/uploads/--folder_name--/{{img}}"alt="{{img}}" /></a></li>
  { % endfor % }
</ul>
```

The rest of the file consists of three elements one section with the icons and general info, one blockquote for the intro essay and last a div with the next project links.

### 2. The images will be uploaded to GitHub 

This site is hosted in [GitHub Pages](https://pages.github.com/) so it is very convenient to upload the images there. I use a separate folder for each photo essay with the title of the post. 

### 3. The script 

The Thor script has 2 major changes compared to the one used for the [blog post](http://rpk.io/posts/automatically-create-jekyll-posts-with-thor/) generation. 

* The attributes passed via a interactive prompt after running the script. 
* The file's content it is not generated inside the script but it copies a sample post and replaces the keywords in it based on the input.

```ruby
  #!/usr/bin/env ruby
  #!/usr/bin/env ruby
  require 'fileutils'
  require 'thor'

  class PhotoPost < Thor
    include Thor::Actions

    no_commands do
      def directories_exists?(dir1, dir2)
        File.directory?(dir1) && File.directory?(dir2)
      end
    end

    desc "create", "Use the interactive prompt to create a new photo essay"

    def create
      say("New photo essay", Thor::Shell::Color::YELLOW)

      photos_count = ask("Number of photos:")
      title = ask("Title:")
      path = ask("Folder name:")
      date = ask("Date (Nov 2014):")
      place = ask("Place:")
      camera = ask("Camera:")
      film = ask("Film:")
      next_project_title = ask("Next Project Title:")
      next_project_path = ask("Next Project Path:")
      description = ask("Description:")

      number_of_photos = ""
      (1..photos_count.to_i).each do |l|
        number_of_photos << "  - #{l}.jpg\n"
      end

      dirname = File.dirname("../photos/#{path}/index.html")
      uploads_dirname = File.dirname("../uploads/#{path}/image.jpg")

      if directories_exists?(dirname, uploads_dirname)
        puts "Photo essay with the same name already exists!"
      else
        FileUtils.mkdir_p(dirname)
        FileUtils.mkdir_p(uploads_dirname)
        temp = File.read("sample_post").
          gsub(/--number_of_photos--/, number_of_photos).
          gsub(/--title--/, title).
          gsub(/--folder_name--/, path).
          gsub(/--date--/, date).
          gsub(/--place--/, place).
          gsub(/--camera--/, camera).
          gsub(/--film--/, film).
          gsub(/--next_project_title--/, next_project_title).
          gsub(/--next_project_path--/, next_project_path).
          gsub(/--description--/, description)
        File.open(dirname + "/index.html", "w+") do |out|
          out << temp
        end

        if directories_exists?(dirname, uploads_dirname)
          say("Created >> #{dirname}/index.html", Thor::Shell::Color::GREEN)
          say("Created >> #{uploads_dirname}", Thor::Shell::Color::GREEN)
          say("Reminder: Add the photos to the uploads folder", Thor::Shell::Color::RED)
        end
      end
    end
  end
``` 

Running the script:

<script type="text/javascript" src="https://asciinema.org/a/14312.js" id="asciicast-14312" data-theme="solarized-dark" async></script>




