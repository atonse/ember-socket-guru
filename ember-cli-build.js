/* eslint-env node*/
/* eslint-disable no-var */
/* global require, module */
var EmberAddon = require('ember-cli/lib/broccoli/ember-addon');

module.exports = function(defaults) {
  var app = new EmberAddon(defaults, {
    svgJar: {
      sourceDirs: ['tests/dummy/public'],
    },
    snippetPaths: ['tests/dummy/app/snippets'],
  });

  return app.toTree();
};
