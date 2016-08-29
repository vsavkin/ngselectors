/**
 * Rewrite the package.json that gets published to npm.
 * * Change main to point to ngselectors.js instead of dist/ngselectors.js
 * * Change angular2 to be a peer dependency
 */
var fs = require('fs');
var srcPackage = require('../package.json');
var [MAIN, JSNEXT_MAIN] = ['main', 'jsnext:main'].map(k => srcPackage[k].replace('/dist/', '/'));
var outPackage = Object.assign({}, srcPackage, {
  peerDependencies: srcPackage.dependencies,
  main: MAIN,
  typings: "index.d.ts",
  "jsnext:main": JSNEXT_MAIN,
  dependencies: undefined
});

fs.writeFileSync('./dist/package.json', JSON.stringify(outPackage, null, 2));