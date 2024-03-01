const winshortcut = require('./winshortcut-binding.js');
module.exports = exports = winshortcut;

winshortcut.openShellProperty2 = function(path) {
  return winshortcut.openShellProperty(path);
}
