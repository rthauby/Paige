(function() {
  var base_config, check_for_docco, configuration, ensure_directory, exec, fs, get_project_name, mdown_template, paige_background, path, process_config, process_docco_files, process_html_file, read_config, showdown, spawn, template, _, _ref;
  _ = require("underscore");
  fs = require('fs');
  path = require('path');
  showdown = require('./../vendor/showdown').Showdown;
  _ref = require('child_process'), spawn = _ref.spawn, exec = _ref.exec;
  configuration = {};
  base_config = {
    "title": "Untitled",
    "content_file": "README.mdown",
    "include_index": false,
    "docco_files": null,
    "header": "Untitled",
    "subheader": "Untitled",
    "background": "bright_squares"
  };
  ensure_directory = function(dir, callback) {
    return exec("mkdir -p " + dir, function() {
      return callback();
    });
  };
  template = function(str) {
    return new Function('obj', 'var p=[],print=function(){p.push.apply(p,arguments);};' + 'with(obj){p.push(\'' + str.replace(/[\r\t\n]/g, " ").replace(/'(?=[^<]*%>)/g, "\t").split("'").join("\\'").split("\t").join("'").replace(/<%=(.+?)%>/g, "',$1,'").split('<%').join("');").split('%>').join("p.push('") + "');}return p.join('');");
  };
  process_docco_files = function() {
    return exec("ls " + configuration.docco_files, function(error, stdout, stderr) {
      process.ARGV = process.argv = stdout.trim().split("\n");
      return require('docco');
    });
  };
  process_config = function(config) {
    if (config == null) {
      config = {};
    }
    return _.map(config, function(value, key, list) {
      if (config[key] != null) {
        return configuration[key] = value;
      }
    });
  };
  get_project_name = function(name) {
    return name.substr(0, name.lastIndexOf('.')).substr(name.lastIndexOf('/') + 1) || name;
  };
  process_html_file = function() {
    var source;
    source = configuration.content_file;
    return fs.readFile(source, "utf-8", function(error, code) {
      var content_html, html;
      content_html = showdown.makeHtml(code);
      if (error) {
        throw error;
      }
      html = mdown_template({
        content_html: content_html,
        title: configuration.title,
        header: configuration.header,
        subheader: configuration.subheader,
        include_index: configuration.include_index,
        subfiles: ["lnoe.html", "board_pieces.html"]
      });
      console.log("paige: " + source + " -> docs/index.html");
      return fs.writeFile("docs/index.html", html);
    });
  };
  mdown_template = template(fs.readFileSync(__dirname + '/../resources/paige.jst').toString());
  paige_background = function() {
    return fs.readFileSync(__dirname + ("/../resources/" + configuration.background + ".png"));
  };
  check_for_docco = function() {
    if (configuration.docco_files != null) {
      return process_docco_files();
    }
  };
  read_config = function(callback) {
    var filename;
    filename = "paige.config";
    if (process.ARGV[2] != null) {
      filename = process.ARGV[2];
    }
    return fs.readFile(filename, "utf-8", function(error, data) {
      var config;
      if (error) {
        throw error;
      }
      config = JSON.parse(data);
      if (callback) {
        return callback(config);
      }
    });
  };
  ensure_directory('docs', function() {
    return read_config(function(config) {
      process_config(config);
      fs.writeFile('docs/bg.png', paige_background());
      process_html_file();
      return check_for_docco();
    });
  });
}).call(this);
