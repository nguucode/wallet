// `import x from './file.yaml?json'`: parse at build time so the YAML parser never ships to the browser.
module.exports = function (src) { return `export default ${JSON.stringify(require('yaml').parse(src))}` }
