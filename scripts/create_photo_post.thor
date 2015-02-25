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

    dirname = File.dirname("../photo_essays/#{path}/index.html")
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