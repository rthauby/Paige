(function() {
  var base_config, check_for_rocco, clean_file_extension, clean_path_names, config_template, configuration, copy_image, ensure_directory, events, exec, fs, get_subfiles, mdown_template, paige_background, path, process_config, process_docco_files, process_html_file, process_rocco_wrappers, promise, read_config, rocco, showdown, spawn, template, wrapper_template, _, _ref;
  _ = require("underscore");
  fs = require('fs');
  path = require('path');
  showdown = require('./../vendor/showdown').Showdown;
  _ref = require('child_process'), spawn = _ref.spawn, exec = _ref.exec;
  events = require('events');
  promise = new events.EventEmitter;
  rocco = require('./rocco.js');
  ensure_directory = function(dir, callback) {
    return exec("mkdir -p " + dir, function() {
      return callback();
    });
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
        console.log("\nCould not find a configuration file. (default: ./paige.config)");
        console.log("Create and specify a configuration file. Example:\n\n");
        return console.log(config_template + "\n");
      } else {
        config = JSON.parse(data);
        process_config(config);
        if (callback) {
          return callback(config);
        }
      }
    });
  };
  copy_image = function() {
    var desired_image;
    desired_image = paige_background();
    return fs.writeFile('docs/bg.png', desired_image);
  };
  template = function(str) {
    return new Function('obj', 'var p=[],print=function(){p.push.apply(p,arguments);};' + 'with(obj){p.push(\'' + str.replace(/[\r\t\n]/g, " ").replace(/'(?=[^<]*%>)/g, "\t").split("'").join("\\'").split("\t").join("'").replace(/<%=(.+?)%>/g, "',$1,'").split('<%').join("');").split('%>').join("p.push('") + "');}return p.join('');");
  };
  get_subfiles = function(callback) {
    var count, find_files, results;
    results = [];
    count = 0;
    find_files = function(file, total) {
      var f_file, f_path;
      f_path = file.substr(0, file.lastIndexOf('/') + 1);
      f_file = file.substr(file.lastIndexOf('/') + 1);
      return exec("find ./" + f_path + " -name '" + f_file + "' -print", function(error, stdout, stderr) {
        count++;
        results = _.uniq(_.union(results, stdout.trim().split("\n")));
        if (count >= total) {
          if (callback) {
            return callback(results.sort());
          }
        }
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
  process_docco_files = function() {
    return get_subfiles(function(result) {
      return rocco(result);
    });
  };
  process_rocco_wrappers = function() {
    return get_subfiles(function(result) {
      result = clean_path_names(result);
      result = clean_file_extension(result);
      return _.each(result, function(file) {
        var html;
        html = wrapper_template({
          title: configuration.title,
          header: configuration.header,
          subheader: configuration.subheader,
          file: file
        });
        return fs.writeFile("docs/doc_" + file + ".html", html);
      });
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
  process_html_file = function() {
    var source;
    source = configuration.content_file;
    return get_subfiles(function(result) {
      var subfiles, subfiles_names;
      if (configuration.include_index) {
        subfiles_names = clean_file_extension(result);
      }
      if (configuration.include_index) {
        subfiles = clean_path_names(result);
      }
      return fs.readFile(source, "utf-8", function(error, code) {
        var content_html, html;
        if (error) {
          console.log("\nThere was a problem reading your the content file: " + source);
          throw error;
        } else {
          content_html = showdown.makeHtml(code);
          html = mdown_template({
            content_html: content_html,
            title: configuration.title,
            header: configuration.header,
            subheader: configuration.subheader,
            include_index: configuration.include_index,
            subfiles: subfiles,
            subfiles_names: subfiles_names
          });
          console.log("paige: " + source + " -> docs/index.html");
          return fs.writeFile("docs/index.html", html);
        }
      });
    });
  };
  paige_background = function() {
    return fs.readFileSync(__dirname + ("/../resources/" + configuration.background + ".png"));
  };
  check_for_rocco = function() {
    if (configuration.docco_files != null) {
      process_docco_files();
      return process_rocco_wrappers();
    }
  };
  mdown_template = template(fs.readFileSync(__dirname + '/../resources/paige.jst').toString());
  wrapper_template = template(fs.readFileSync(__dirname + '/../resources/doc.jst').toString());
  config_template = fs.readFileSync(__dirname + '/../resources/paige.config').toString();
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
  ensure_directory('docs', function() {
    return read_config(function(config) {
      copy_image();
      process_html_file();
      return check_for_rocco();
    });
  });
}).call(this);
