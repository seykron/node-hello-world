module.exports = function(grunt) {
  var SECRET_FILE = "config/secret.json";
  var fs = require("fs");
  var secret;
  var targetEnv = grunt.option('env') || 'dev';
  var extend = require("extend");

  if (fs.existsSync(SECRET_FILE)) {
    secret = grunt.file.readJSON(SECRET_FILE);
  }

  // Project configuration.
  grunt.initConfig(extend({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      files: [
        "app/**/*.js",
        "lib/**/*.js",
        "!**/vendor/**/*.js"
      ],
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        node: true,
        globals: {
          exports: true,
          module: false,
          window: true,
          app: true,
          jQuery: true,
          FB: true,
          twttr: true,
          ppar: true
        }
      }
    },
    clean: {
      folder: "dist",
      folderTwo: ["build"]
    },
    copy: {
      main: {
        files: [{
          expand: true,
          src: ["app/**", "lib/**", "index.js", "package.json", "!**/data/**",
            "!**/vendor/lib/**", "sql/db-setup.sql", "sql/db-setup.d/*.sql",
            "sql/db-setup.d/*.json", "Deployment.md", "Gruntfile.js"],
          dest: "build/<%= pkg.name %>"
        }, {
          expand: false,
          src: ["support/remote_deploy.sh"],
          dest: "dist/remote_deploy.sh"
        }]
      }
    },
    compress: {
      main: {
        options: {
          archive: "dist/<%= pkg.name %>-<%= pkg.version %>.tgz",
          mode: "tgz"
        },
        files: [{
          expand: true,
          src: ["**"], // What should be included in the zip
          dest: ".",
          cwd: "build"
        }]
      }
    },
    release: {
      options: {
        push: false,
        npm: false,
        folder: "build",
        beforeBump: ["jshint"],
        beforeRelease: ["clean", "copy", "compress"],
        github: {
          repo: "seykron/node-hello-world",
          usernameVar: "GITHUB_USERNAME",
          passwordVar: "GITHUB_PASSWORD"
        }
      }
    },
    secret: secret,
    "sftp": {
      deploy: {
        files: {
          "./": ["dist/*"]
        },
        options: {
          host: "<%= secret.host %>",
          path: "<%= secret.remotePath %>",
          username: "<%= secret.username %>",
          privateKey: secret && grunt.file.read(secret.privateKey),
          passphrase: "<%= secret.passphrase %>",
          srcBasePath: "dist/",
          showProgress: true
        }
      }
    },
    "sshexec": {
      dev: {
        command: "<%= secret.remotePath %>/remote_deploy.sh " +
          "<%= pkg.version %> dev",
        options: {
          host: "<%= secret.host %>",
          username: "<%= secret.username %>",
          privateKey: secret && grunt.file.read(secret.privateKey),
          passphrase: "<%= secret.passphrase %>"
        }
      }
    }
  }, grunt.file.readJSON("Gruntfile.client.json")));

  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks("grunt-release");
  grunt.loadNpmTasks('grunt-ssh');
  grunt.loadNpmTasks('grunt-npmcopy');

  // Default task.
  grunt.registerTask("default", ["jshint", "clean", "copy", "compress"]);

  grunt.registerTask("deploy", ["jshint", "clean", "copy", "compress",
    "sftp", "sshexec:" + targetEnv]);
};
