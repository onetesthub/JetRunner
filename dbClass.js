class DbClass {
  constructor(db) {
    this.db = db;
  }
  addIndex(fieldName, unique = true) {
    return new Promise((resolve, reject) => {
      if (!fieldName) {
        resolve({ status: responseStatus.error, message: "Bad request" });
      }
      this.db.ensureIndex({ fieldName, unique }, function (err) {
        if (err) resolve({ status: responseStatus.error, message: "Unexpected error", });
        else resolve({ status: responseStatus.success, message: "Index added", });
      });
    });
  }
  add(data) {
    return new Promise((resolve, reject) => {
      if (!data || Object.entries(data).length < 1) {
        resolve({ status: responseStatus.error, message: "Bad request" });
      }
      this.db.insert(data, (err, doc) => {
        if (err) resolve({ status: responseStatus.error, message: "Unexpected error", });
        else resolve({ status: responseStatus.success, message: "Data stored", data: doc });
      });
    });
  }
  findOne(filter) {
    return new Promise((resolve, reject) => {
      if (!filter || Object.entries(filter).length < 1) {
        resolve({ status: responseStatus.error, message: "Bad request" });
      }
      this.db.findOne(filter, function (err, doc) {
        if (err) resolve({ status: responseStatus.error, message: "Unexpected error", });
        else if (doc && doc.length < 1) resolve({ status: responseStatus.empty, message: "No data found", data: null });
        else resolve({ status: responseStatus.success, message: "Data fetched", data: doc });
      });
    });
  }
  findMany(filter) {
    return new Promise((resolve, reject) => {
      if (!filter || Object.entries(filter).length < 1) {
        resolve({ status: responseStatus.error, message: "Bad request" });
      }
      this.db.find(filter, function (err, docs) {
        if (err) resolve({ status: responseStatus.error, message: "Unexpected error while updating database", });
        else if (docs && docs.length < 1) resolve({ status: responseStatus.empty, message: "No data found", data: null });
        else resolve({ status: responseStatus.success, message: "Data fetched", data: docs });
      });
    });
  }
  findAll() {
    return new Promise((resolve, reject) => {
      this.db.find({}, function (err, docs) {
        if (err) resolve({ status: responseStatus.error, message: "Unexpected error while updating database", });
        else if (docs && docs.length < 1) resolve({ status: responseStatus.empty, message: "No data found", data: null });
        else resolve({ status: responseStatus.success, message: "Data fetched", data: docs });
      });
    });
  }
  removeOne(filter) {
    return new Promise((resolve, reject) => {
      if (!filter || Object.entries(filter).length < 1) {
        resolve({ status: responseStatus.error, message: "Bad request" });
      }
      this.db.remove(filter, { multi: false }, function (err, numRemoved) {
        if (err) resolve({ status: responseStatus.error, message: "Unexpected error while updating database", });
        else if (numRemoved < 1) resolve({ status: responseStatus.empty, message: "No entry removed", data: null });
        else resolve({ status: responseStatus.success, message: "Data deleted", data: numRemoved });
      });
    });
  }
  removeMany(filter) {
    return new Promise((resolve, reject) => {
      if (!filter || Object.entries(filter).length < 1) {
        resolve({ status: responseStatus.error, message: "Bad request" });
      }
      this.db.remove(filter, { multi: true }, function (err, numRemoved) {
        if (err) resolve({ status: responseStatus.error, message: "Unexpected error while updating database", });
        else if (numRemoved < 1) resolve({ status: responseStatus.empty, message: "No entry removed", data: null });
        else resolve({ status: responseStatus.success, message: "Data deleted", data: numRemoved });
      });
    });
  }
  removeAll() {
    return new Promise((resolve, reject) => {
      this.db.remove({}, { multi: true }, function (err, numRemoved) {
        if (err) resolve({ status: responseStatus.error, message: "Unexpected error while updating database", });
        else if (numRemoved < 1) resolve({ status: responseStatus.empty, message: "No entry removed", data: null });
        else resolve({ status: responseStatus.success, message: "Data deleted", data: numRemoved });
      });
    });
  }
  updateOne(filter, data) {
    return new Promise((resolve, reject) => {
      if (!filter || Object.entries(filter).length < 1 || !data || Object.entries(data).length < 1) {
        resolve({ status: responseStatus.error, message: "Bad request" });
      }
      this.db.update(filter, { $set: data }, { multi: false }, function (err, numReplaced) {
        if (err) resolve({ status: responseStatus.error, message: "Unexpected error while updating database", });
        else if (numReplaced < 1) resolve({ status: responseStatus.empty, message: "No entry updated", data: null });
        else resolve({ status: responseStatus.success, message: "Data updated", data: numReplaced });
      });
    });
  }
  updateMany(filter, data) {
    return new Promise((resolve, reject) => {
      if (!filter || Object.entries(filter).length < 1 || !data || Object.entries(data).length < 1) {
        resolve({ status: responseStatus.error, message: "Bad request" });
      }
      this.db.update(filter, { $set: data }, { multi: true }, function (err, numReplaced) {
        if (err) resolve({ status: responseStatus.error, message: "Unexpected error while updating database", });
        else if (numReplaced < 1) resolve({ status: responseStatus.empty, message: "No entry removed", data: null });
        else resolve({ status: responseStatus.success, message: "Data updated", data: numReplaced });
      });
    });
  }
}
//! imports
const { responseStatus } = require('./const');
const editJsonFile = require('edit-json-file');
// let databasePath = "C:\\Users\\DELL\\Desktop\\request_test"; //* hardwired database path
let db = require('./db'); //* impoerting database function
// let { suiteNamedb, suitesdb, environmentdb, metaInfo } = db(databasePath); //*
//! export
module.exports = init = ({ projectName, projectPath }) => {
  //TODO: get project path based on project name
  if (!projectPath) {
    const appRoot = remote.app.getPath('userData');
    const metaDataPath = path.resolve(appRoot, 'metaData', 'metaData.json');
    const metaFile = editJsonFile(metaDataPath, { autosave: true });
    let currProjectObj = metaFile.get(projectName);
    projectPath = currProjectObj.projectPath
  }

  let { suiteNamedb, suitesdb, environmentdb, metaInfo } = db(projectPath);
  return {
    SUITE_DB: new DbClass(suiteNamedb),
    REQUEST_DB: new DbClass(suitesdb),
    ENV_DB: new DbClass(environmentdb),
    META_DB: new DbClass(metaInfo),
  }
}