module.exports = function(grunt) {
  var config = {
    src: "src",
    dest: "dist"
  };

  grunt.initConfig({
    watch: {
      options: {
        spawn: false
      },
      js: {
        files: config.src + "/**/*.js"
      },
      css: {
        files: config.src + "/**/*.css"
      },
      html: {
        files: config.src + "/**/*.html",
        tasks: ["html2js"],
        options: {
          spawn: true
        }
      }
    },
    useminPrepare: {
      html: config.src + "/index.html",
      options: {
        dest: config.dest,
        flow: {
          steps: {
            js: ["concat", "uglify"],
            css: ["concat", "cssmin"]
          },
          post: {
            js: [
              {
                name: "uglify",
                createConfig: function(context, block) {
                  var generated = context.options.generated;
                  generated.options = {
                    mangle: false,
                    compress: true
                  };
                }
              }
            ]
          }
        }
      }
    },
    usemin: {
      html: config.dest + "/index.html",
      options: {
        assetsDirs: [config.dest]
      }
    },
    filerev: {
      options: {
        algorithm: "md5",
        length: 8
      },
      js: {
        src: config.dest + "/**/*.js"
      },
      css: {
        src: config.dest + "/**/*.css"
      }
    },
    copy: {
      main: {
        files: [
          {
            expand: true,
            cwd: config.src,
            src: ["index.html", "images/**/*"],
            dest: config.dest,
            filter: "isFile"
          },
          {
            expand: true,
            cwd: "node_modules/bootstrap",
            src: ["fonts/**/*"],
            dest: config.dest,
            filter: "isFile"
          }
        ]
      }
    },
    clean: {
      dest: config.dest,
      tmp: ".tmp"
    },
    browserSync: {
      dev: {
        bsFiles: {
          src: config.src
        },
        options: {
          server: {
            baseDir: ["./" + config.src],
            routes: {
              "/node_modules": "./node_modules"
            }
          },
          watchTask: true
        }
      },
      prod: {
        bsFiles: {
          src: config.dest
        },
        options: {
          server: {
            baseDir: ["./" + config.dest]
          }
        }
      }
    },
    html2js: {
      options: {
        base: config.src,
        module: config.templatesModuleName
      },
      main: {
        src: [config.src + "/**/*.html"],
        dest: config.src + "/__templates.js"
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-browser-sync");
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-cssmin");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-filerev");
  grunt.loadNpmTasks("grunt-html2js");
  grunt.loadNpmTasks("grunt-usemin");

  grunt.registerTask("build", [
    "clean:dest",
    "clean:tmp",
    "html2js",
    "useminPrepare",
    "concat",
    "cssmin",
    "uglify",
    "usemin"
  ]);

  grunt.registerTask("dev", ["html2js", "browserSync:dev", "watch"]);
};
