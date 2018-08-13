/* eslint-env node */

const BabelTranspiler = require('broccoli-babel-transpiler');
const Funnel = require('broccoli-funnel');
const MergeTrees = require('broccoli-merge-trees');
const path = require('path');

const vendorFiles = {
  phoenix: 'vendor/modules/phoenix.js',
};

const defaultInclude = ['pusher', 'socketio', 'phoenix', 'action-cable'];

module.exports = {
  name: 'ember-socket-guru',

  included(app) {
    this._super.included.apply(this, arguments);
    // see: https://github.com/ember-cli/ember-cli/issues/3718
    const importType = typeof app.import;
    let newApp = app;
    if (importType !== 'function') {
      newApp = app.app;
    }

    this.app = newApp;
    this.app.options = this.app.options || {};
    const config = this.app.options[this.name];
    const clientsToInclude = (config && config.includeOnly) ? config.includeOnly : defaultInclude;
    this.clientsToInclude = clientsToInclude;
    clientsToInclude.forEach((vendor) => {
      app.import(vendorFiles[vendor]);
    });
  },

  treeForAddon() {
    const addonTree = this._super.treeForAddon.apply(this, arguments);
    const transpiled = new BabelTranspiler('vendor', {
      blacklist: ['es6.modules'],
    });
    const phoenixVendorTree = new Funnel(transpiled, {
      destDir: 'modules',
    });
    const mergedTree = new MergeTrees([addonTree, phoenixVendorTree]);
    const config = this.app.options[this.name];
    const clientsToInclude = (config && config.includeOnly) ? config.includeOnly : defaultInclude;
    const regex = new RegExp(`^modules/${this.name}/socket-clients/`, 'i');
    const filteredTree = new Funnel(mergedTree, {
      exclude: [function(name) {
        return regex.test(name) && !clientsToInclude.includes(path.basename(name, '.js'));
      }],
    });

    return filteredTree;
  },

  treeForVendor() {
    const vendorTree = this._super.treeForVendor.apply(this, arguments);
    const transpiled = new BabelTranspiler(vendorTree, {
      loose: true,
      modules: 'amdStrict',
      moduleIds: true,
    });
    const finishedTree = new Funnel(transpiled, {
      destDir: 'modules',
    });
    return new MergeTrees([vendorTree, finishedTree]);
  },
};
