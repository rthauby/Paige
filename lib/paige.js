(function() {
  var check_for_rocco, clean_file_extension, clean_path_names, config_template, configuration, copy_image, ensure_directory, events, exec, fs, get_subfiles, mdown_template, path, process_config, process_html_file, read_config, rocco, showdown, spawn, subfiles, template, _, _ref,
    _this = this;

  _ = require("underscore");

  fs = require('fs');

  path = require('path');

  showdown = require('./../vendor/showdown').Showdown;

  _ref = require('child_process'), spawn = _ref.spawn, exec = _ref.exec;

  events = require('events');

  rocco = require('./rocco.js');

  subfiles = [];

  configuration = {
    "title": "Untitled",
    "content_file": "README.mdown",
    "include_index": false,
    "docco_files": null,
    "header": "Untitled",
    "subheader": "Untitled",
    "background": "bright_squares",
    "output": "docs"
  };

  read_config = function(callback) {
    var filename;
    filename = "paige.config";
    if (process.argv[2] != null) filename = process.argv[2];
    return fs.readFile(filename, "utf-8", function(error, data) {
      var config;
      if (error) {
        console.log("\nCould not find a configuration file. (default: ./paige.config)");
        console.log("Create and specify a configuration file. Example:\n\n");
        return console.log(config_template + "\n");
      } else {
        config = JSON.parse(data);
        process_config(config);
        if (callback) return callback(config);
      }
    });
  };

  process_config = function(config) {
    if (config == null) config = {};
    return _.map(config, function(value, key, list) {
      if (config[key] != null) return configuration[key] = value;
    });
  };

  ensure_directory = function(dir, callback) {
    return exec("mkdir -p " + dir, function() {
      return callback();
    });
  };

  copy_image = function() {
    var desired_image;
    desired_image = fs.readFileSync(__dirname + ("/../resources/" + configuration.background + ".png"));
    return fs.writeFile("" + configuration.output + "/bg.png", desired_image);
  };

  process_html_file = function() {
    var clean_subfiles, source, subfiles_names;
    source = configuration.content_file;
    if (configuration.include_index) {
      subfiles_names = clean_file_extension(subfiles);
    }
    if (configuration.include_index) clean_subfiles = clean_path_names(subfiles);
    return fs.readFile(source, "utf-8", function(error, code) {
      var content_html, html;
      if (error) {
        console.log("\nThere was a problem reading your the content file: " + source);
        throw error;
      } else {
        code = code.replace(/```\w*\n?([^```]*)```/gm, '<pre>\n$1</pre>');
        content_html = showdown.makeHtml(code);
        html = mdown_template({
          content_html: content_html,
          title: configuration.title,
          header: configuration.header,
          subheader: configuration.subheader,
          github: configuration.github,
          include_index: configuration.include_index,
          subfiles: clean_subfiles,
          subfiles_names: subfiles_names
        });
        console.log("paige: " + source + " -> " + configuration.output + "/index.html");
        return fs.writeFile("" + configuration.output + "/index.html", html);
      }
    });
  };

  template = function(str) {
    return new Function('obj', 'var p=[],print=function(){p.push.apply(p,arguments);};' + 'with(obj){p.push(\'' + str.replace(/[\r\t\n]/g, " ").replace(/'(?=[^<]*%>)/g, "\t").split("'").join("\\'").split("\t").join("'").replace(/<%=(.+?)%>/g, "',$1,'").split('<%').join("');").split('%>').join("p.push('") + "');}return p.join('');");
  };

  get_subfiles = function(callback) {
    var count, find_files;
    count = 0;
    find_files = function(file, total) {
      var f_file, f_path;
      f_path = file.substr(0, file.lastIndexOf('/') + 1);
      f_file = file.substr(file.lastIndexOf('/') + 1);
      return exec("find ./" + f_path + " -name '" + f_file + "' -print", function(error, stdout, stderr) {
        count++;
        subfiles = _.uniq(_.union(subfiles, stdout.trim().split("\n")));
        if (count >= total) if (callback) return callback();
      });
    };
    if (_.isArray(configuration.docco_files)) {
      return _.each(configuration.docco_files, function(file) {
        return find_files(file, configuration.docco_files.length);
      });
    } else if (_.isString(configuration.docco_files)) {
      return find_files(configuration.docco_files, 1);
    }
  };

  clean_path_names = function(names) {
    var clean_names;
    clean_names = [];
    _.each(names, function(name) {
      return clean_names.push(name.substr(name.lastIndexOf('/') + 1) || name);
    });
    return clean_names;
  };

  clean_file_extension = function(names) {
    var clean_names;
    clean_names = [];
    _.each(names, function(name) {
      return clean_names.push(name.substr(0, name.lastIndexOf('.')).substr(name.lastIndexOf('/') + 1) || name);
    });
    return clean_names;
  };

  check_for_rocco = function() {
    if (configuration.docco_files != null) return rocco(subfiles, configuration);
  };

  mdown_template = template(fs.readFileSync(__dirname + '/../resources/paige.jst').toString());

  config_template = fs.readFileSync(__dirname + '/../resources/paige.config').toString();

  read_config(function(config) {
    return ensure_directory(configuration.output, function() {
      return get_subfiles(function() {
        copy_image();
        process_html_file();
        return check_for_rocco();
      });
    });
  });

}).call(this);
