# Require our external dependencies, including **Showdown.js**
# (the JavaScript implementation of Markdown).
_ =               require "underscore"
fs =              require 'fs'
path =            require 'path'
showdown =        require('./../vendor/showdown').Showdown
{spawn, exec} =   require 'child_process'

# Ensure that the destination directory exists.
ensure_directory = (dir, callback) ->
  exec "mkdir -p #{dir}", -> callback()


# Micro-templating, originally by John Resig, borrowed by way of
# [Underscore.js](http://documentcloud.github.com/underscore/).
template = (str) ->
  new Function 'obj',
    'var p=[],print=function(){p.push.apply(p,arguments);};' +
    'with(obj){p.push(\'' +
    str.replace(/[\r\t\n]/g, " ")
       .replace(/'(?=[^<]*%>)/g,"\t")
       .split("'").join("\\'")
       .split("\t").join("'")
       .replace(/<%=(.+?)%>/g, "',$1,'")
       .split('<%').join("');")
       .split('%>').join("p.push('") +
       "');}return p.join('');"


# Kind of hacky, but I can't figure out another way of doing this cleanly
get_subfiles = (callback) ->
  exec "ls #{configuration.docco_files}", (error, stdout, stderr) ->
    callback stdout.trim().split("\n") if callback


# ...
process_docco_files = ->
  get_subfiles (result) ->
    process.ARGV = process.argv = result
    require 'docco'


# ...
process_docco_wrappers = ->
  get_subfiles (result) ->
    result = clean_path_names result
    result = clean_file_extension result
    _.each result, (file) ->
      html = wrapper_template {
        title:            configuration.title,
        header:           configuration.header,
        subheader:        configuration.subheader,
        file:             file
      }
      fs.writeFile "docs/doc_#{file}.html", html


# ...
process_config = (config={}) ->
  _.map config, (value, key, list) ->
    configuration[key] = value if config[key]?


#...
clean_path_names = (names) ->
  clean_names = []
  _.each names, (name) ->
    clean_names.push name.substr(name.lastIndexOf('/')+1) || name
  return clean_names


# ...
clean_file_extension = (names) ->
  clean_names = []
  _.each names, (name) ->
    clean_names.push name.substr(0,name.lastIndexOf('.')).substr(name.lastIndexOf('/')+1) || name
  return clean_names


# ...
process_html_file = ->
  source = configuration.content_file
  get_subfiles (result) ->
    subfiles_names = clean_file_extension(result) if configuration.include_index
    subfiles = clean_path_names(result) if configuration.include_index
    fs.readFile source, "utf-8", (error, code) ->
      content_html = showdown.makeHtml code
      throw error if error
      html = mdown_template {
        content_html:     content_html,
        title:            configuration.title,
        header:           configuration.header,
        subheader:        configuration.subheader,
        include_index:    configuration.include_index,
        subfiles:         subfiles,
        subfiles_names:   subfiles_names
      }
      console.log "paige: #{source} -> docs/index.html"
      fs.writeFile "docs/index.html", html


# ...
paige_background    = ->
  fs.readFileSync(__dirname + "/../resources/#{configuration.background}.png")


# ...
check_for_docco = ->
  if configuration.docco_files?
    process_docco_files()
    process_docco_wrappers()

# ...
read_config = (callback) ->
  filename = "paige.config"
  filename = process.ARGV[2] if process.ARGV[2]?
  fs.readFile filename, "utf-8", (error, data) ->
    if error
      console.log "\nCould not find a configuration file. (default: ./paige.config)"
      console.log "Create and specify a configuration file. Example:\n\n"
      console.log config_template + "\n"
    else
      config = JSON.parse(data)
      callback(config) if callback

# ...
mdown_template  = template fs.readFileSync(__dirname + '/../resources/paige.jst').toString()

# ...
wrapper_template  = template fs.readFileSync(__dirname + '/../resources/doc.jst').toString()

# ...
config_template  = fs.readFileSync(__dirname + '/../resources/paige.config').toString()

# ...
configuration = {}

# ...
base_config = {
  "title" :             "Untitled",
  "content_file" :      "README.mdown",
  "include_index" :     false,
  "docco_files" :       null,
  "header" :            "Untitled",
  "subheader" :         "Untitled",
  "background" :        "bright_squares"
}

# Run the script
ensure_directory 'docs', ->
  read_config (config) ->
    process_config(config)
    fs.writeFile 'docs/bg.png', paige_background()
    process_html_file()
    check_for_docco()