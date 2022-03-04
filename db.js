const Datastore = require("@seald-io/nedb");
let path = require('path');
module.exports = (projectPath) => {
  return {
    // historydb: new Datastore({
    //   filename: path.join(projectPath, "history.db"),
    //   autoload: true
    // }),
    suiteNamedb: new Datastore({
      filename: path.join(projectPath, "suites.db"),
      autoload: true
    }),
    suitesdb: new Datastore({
      filename: path.join(projectPath, "request.db"),
      autoload: true
    }),
    // authManagerdb: new Datastore({
    //   filename: path.join(projectPath, "authmanager.db"),
    //   autoload: true
    // }),
    environmentdb: new Datastore({
      filename: path.join(projectPath, "environment.db"),
      autoload: true
    }),
    metaInfo: new Datastore({
      filename: path.join(projectPath, "metaInfo.db"),
      autoload: true
    }),
    // runHistorydb: new Datastore({
    //   filename: path.join(projectPath, "runHistory.db"),
    //   autoload: true
    // }),
    // monitordb: new Datastore({
    //   filename: path.join(projectPath, "monitor.db"),
    //   autoload: true
    // }),
  }
}