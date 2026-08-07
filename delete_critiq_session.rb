#!/usr/bin/env ruby
# frozen_string_literal: true

require 'fileutils'
require 'net/http'
require 'uri'
require 'json'
require 'openssl'
require 'tty-prompt'
require 'pastel'

# Configuration
FIREBASE_DB_URL = "https://rpk-critiq-default-rtdb.europe-west1.firebasedatabase.app"
CRITIQ_DIR = "critiq"
SECRET_FILE = "firebase_secret.key"

def get_secret(prompt)
  if File.exist?(SECRET_FILE)
    return File.read(SECRET_FILE).strip
  end
  
  puts "\nAuthentication required for Firebase updates."
  secret = prompt.mask("Please enter your Firebase Database Secret:")
  
  if secret && !secret.empty?
    File.write(SECRET_FILE, secret)
    puts "Secret saved to #{SECRET_FILE} (added to .gitignore)"
    return secret
  end
  nil
end

def archive_firebase_session(session_id, pastel, prompt)
  print pastel.yellow("Archiving Firebase session (marking as inactive)... ")
  
  # Try without auth first (or with existing secret)
  secret = File.exist?(SECRET_FILE) ? File.read(SECRET_FILE).strip : nil
  
  uri_str = "#{FIREBASE_DB_URL}/sessions/#{session_id}.json"
  uri_str += "?auth=#{secret}" if secret
  
  uri = URI(uri_str)
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
  http.verify_mode = OpenSSL::SSL::VERIFY_NONE

  # Use PATCH to update specific fields without overwriting the whole object
  request = Net::HTTP::Patch.new(uri.request_uri)
  request['Content-Type'] = 'application/json'
  request.body = { archived: true, archived_at: Time.now.to_i }.to_json
  
  response = http.request(request)

  if response.code.to_i == 401
    # Unauthorized - ask for secret
    puts pastel.red("❌ Unauthorized")
    secret = get_secret(prompt)
    
    if secret
      print pastel.yellow("Retrying with secret... ")
      uri = URI("#{FIREBASE_DB_URL}/sessions/#{session_id}.json?auth=#{secret}")
      request = Net::HTTP::Patch.new(uri.request_uri)
      request['Content-Type'] = 'application/json'
      request.body = { archived: true, archived_at: Time.now.to_i }.to_json
      response = http.request(request)
    end
  end

  if response.code.to_i >= 200 && response.code.to_i < 300
    puts pastel.green("✅ Done")
  else
    puts pastel.red("❌ Failed")
    puts pastel.red("   Status: #{response.code} #{response.message}")
    puts pastel.dim("   Note: Check your Firebase security rules if you get 401 Unauthorized.")
  end
rescue StandardError => e
  puts pastel.red("❌ Error")
  puts pastel.red("   #{e.message}")
end

def get_firebase_sessions(pastel, prompt)
  # Try without auth first
  secret = File.exist?(SECRET_FILE) ? File.read(SECRET_FILE).strip : nil
  
  uri_str = "#{FIREBASE_DB_URL}/sessions.json?shallow=true"
  uri_str += "&auth=#{secret}" if secret
  
  uri = URI(uri_str)
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
  http.verify_mode = OpenSSL::SSL::VERIFY_NONE

  request = Net::HTTP::Get.new(uri.request_uri)
  response = http.request(request)

  if response.code.to_i == 401
    # Unauthorized - ask for secret
    puts pastel.yellow("⚠️  Unauthorized to list sessions.")
    secret = get_secret(prompt)
    
    if secret
      print pastel.cyan("Retrying with secret... ")
      uri = URI("#{FIREBASE_DB_URL}/sessions.json?shallow=true&auth=#{secret}")
      request = Net::HTTP::Get.new(uri.request_uri)
      response = http.request(request)
    end
  end

  if response.code.to_i >= 200 && response.code.to_i < 300
    data = JSON.parse(response.body)
    all_ids = data ? data.keys : []
    
    return [] if all_ids.empty?

    # Filter out archived sessions
    active_ids = []
    
    # Check each session's archived status
    all_ids.each do |id|
      check_uri_str = "#{FIREBASE_DB_URL}/sessions/#{id}/archived.json"
      check_uri_str += "?auth=#{secret}" if secret
      check_uri = URI(check_uri_str)
      
      check_req = Net::HTTP::Get.new(check_uri.request_uri)
      check_res = http.request(check_req)
      
      if check_res.code.to_i >= 200 && check_res.code.to_i < 300
        is_archived = check_res.body.strip == 'true'
        active_ids << id unless is_archived
      else
        # If check fails, assume active to be safe? Or skip?
        # Let's assume active so user can see it and try to delete again if needed.
        active_ids << id
      end
    end
    
    return active_ids
  else
    puts pastel.yellow("⚠️  Warning: Could not fetch sessions from Firebase (Status: #{response.code})")
    return []
  end
rescue StandardError => e
  puts pastel.yellow("⚠️  Warning: Error fetching sessions from Firebase: #{e.message}")
  return []
end

def main
  prompt = TTY::Prompt.new
  pastel = Pastel.new

  unless Dir.exist?(CRITIQ_DIR)
    puts pastel.red("Error: '#{CRITIQ_DIR}' directory not found.")
    exit 1
  end

  # Get local sessions
  local_sessions = Dir.entries(CRITIQ_DIR)
                .select { |entry| File.directory?(File.join(CRITIQ_DIR, entry)) && !['.', '..'].include?(entry) }
  
  # Get Firebase sessions
  print pastel.cyan("Fetching sessions from Firebase... ")
  firebase_sessions = get_firebase_sessions(pastel, prompt)
  puts pastel.green("Done")

  # Merge unique sessions
  all_sessions = (local_sessions + firebase_sessions).uniq.sort

  if all_sessions.empty?
    puts pastel.yellow("No voting sessions found (locally or in Firebase).")
    exit 0
  end

  puts ""
  
  # Prepare choices with a Cancel option at the end
  choices = all_sessions.map { |s| { name: s, value: s } }
  choices << { name: pastel.magenta("Cancel"), value: :cancel }

  begin
    selected_session = prompt.select("Select a session to REMOVE:", choices, filter: true, per_page: 15)
  rescue TTY::Reader::InputInterrupt
    puts "\n" + pastel.yellow("Operation cancelled.")
    exit 0
  end

  if selected_session == :cancel
    puts pastel.yellow("Cancelled.")
    exit 0
  end

  # Check where it exists
  is_local = local_sessions.include?(selected_session)
  is_remote = firebase_sessions.include?(selected_session)
  
  location_info = []
  location_info << "Local Folder" if is_local
  location_info << "Firebase Data" if is_remote
  
  puts pastel.bold("\nYou selected: #{selected_session} (#{location_info.join(' + ')})")
  
  if prompt.yes?("Are you sure you want to remove this session?")
    puts ""
    
    if is_local
      # Delete local directory
      local_path = File.join(CRITIQ_DIR, selected_session)
      if Dir.exist?(local_path)
        FileUtils.rm_rf(local_path)
        puts pastel.green("✅ Local directory deleted: #{local_path}")
      else
        puts pastel.yellow("⚠️  Local directory not found: #{local_path}")
      end
    end

    if is_remote
      # Archive Firebase data
      archive_firebase_session(selected_session, pastel, prompt)
    end
    
    puts pastel.bold.green("\nSession '#{selected_session}' removal complete.")
  else
    puts pastel.yellow("Cancelled.")
  end
end

main
