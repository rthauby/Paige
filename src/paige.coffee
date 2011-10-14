# Require our external dependencies, including **Showdown.js**
# (the JavaScript implementation of Markdown).
_ =               require "underscore"
fs =              require 'fs'
path =            require 'path'
showdown =        require('./../vendor/showdown').Showdown
{spawn, exec} =   require 'child_process'


configuration = {}
base_config = {
  "title" :             "Untitled",
  "content_file" :      "README.mdown",
  "include_index" :     false,
  "docco_files" :       null,
  "header" :            "Untitled",
  "subheader" :         "Untitled",
  "background" :        "bright_squares"
}

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
process_docco_files = ->
  exec "ls #{configuration.docco_files}", (error, stdout, stderr) ->
    process.ARGV = process.argv = stdout.trim().split("\n")
    require 'docco'


process_config = (config={}) ->
  _.map config, (value, key, list) ->
    configuration[key] = value if config[key]?


get_project_name = (name) ->
  return name.substr(0, name.lastIndexOf('.')).substr(name.lastIndexOf('/')+1) || name


process_html_file = ->
  source = configuration.content_file  
  fs.readFile source, "utf-8", (error, code) ->
    content_html = showdown.makeHtml code
    throw error if error
    html  = mdown_template {
      content_html:     content_html,
      title:            configuration.title,
      header:           configuration.header,
      subheader:        configuration.subheader,
      include_index:    configuration.include_index,
      subfiles:         ["lnoe.html","board_pieces.html"]
    }
    console.log "paige: #{source} -> docs/index.html"
    fs.writeFile "docs/index.html", html

# Create the template that we will use to generate the Docco HTML page.
mdown_template  = template fs.readFileSync(__dirname + '/../resources/paige.jst').toString()

# The CSS styles we'd like to apply to the documentation.
paige_background    = ->
  fs.readFileSync(__dirname + "/../resources/#{configuration.background}.png")

# If the user wants to also build the html docs for each individual file, then 
# Go ahead and require docco, that should do the trick.
check_for_docco = ->
  if configuration.docco_files?
    process_docco_files()
    
    
read_config = (callback) ->
  filename = "paige.config"
  filename = process.ARGV[2] if process.ARGV[2]?
  fs.readFile filename, "utf-8", (error, data) ->
    throw error if error
    config = JSON.parse(data)
    callback(config) if callback

# Run the script.
# ---------------

ensure_directory 'docs', ->
  read_config (config) ->
    process_config(config)
    fs.writeFile 'docs/bg.png', paige_background()
    process_html_file()
    check_for_docco()