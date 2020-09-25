const { responseStatus } = require('./const');
let SUITE_DB, REQUEST_DB, ENV_DB, META_DB;
// module.exports = ;
module.exports = init = ({ projectName, projectPath }) => {
  const initDb = require('./dbClass');
  let dbs = initDb({ projectName, projectPath });
  SUITE_DB = dbs.SUITE_DB;
  REQUEST_DB = dbs.REQUEST_DB;
  ENV_DB = dbs.ENV_DB;
  META_DB = dbs.META_DB;
  return { getHead, getRootSuites, getRootSuiteId, fetchSuites, fetchRequests, getNestedSuites, getSuiteNameById };
}

function getHead(suiteId) {
  //? returns head request and head suite for given suite
  return new Promise(async (resolve, reject) => {
    if (!suiteId) {
      resolve({ status: responseStatus.error, message: "Bad request" });
    }
    try {
      let metaDbResposne = await META_DB.findOne({ suiteId }); //? finding root suite
      if (metaDbResposne.status !== responseStatus.success) {
        resolve({ status: responseStatus.error, message: "metadata db error" });
      }
      let { data: { headReq, headSuite }, } = metaDbResposne;
      resolve({ status: responseStatus.success, message: "root fetched", data: { headReq, headSuite }, });
    } catch (error) {
      resolve({ status: responseStatus.error, message: "Unexpected error" });
    }
  });
}
async function getSuiteNameById(suiteId) {
  let suiteDbResponse = await SUITE_DB.findOne({ _id: suiteId });
  if (suiteDbResponse.status !== responseStatus.success) return;
  return suiteDbResponse.data.suiteName;
}
async function getRootSuites() {
  return new Promise(async (resolve, reject) => {
    try {
      let headSuiteRes = await getRootSuiteId(); //? fetching id of root suite
      if (headSuiteRes.status !== responseStatus.success) {
        console.error('error while fetchig root id');
        resolve(false)
      }
      let suiteId = headSuiteRes.data;
      if (!suiteId) return
      let rootSuitesRes = await fetchSuites(suiteId); //? fetching same level suites
      if (rootSuitesRes.status !== responseStatus.success) {
        console.error('error while fetching suites');
        resolve(false)
      }
      let suiteArr = rootSuitesRes.data;
      resolve({ status: responseStatus.success, data: suiteArr });
    } catch (error) {
      resolve(false)
    }
  });
}
function getRootSuiteId() {
  //? returns the ID of top level root suite
  return new Promise(async (resolve, reject) => {
    try {
      let metaDbResposne = await META_DB.findOne({ isHead: true }); //? finding root suite
      if (metaDbResposne.status === responseStatus.empty) {
        resolve({ status: responseStatus.empty, message: "metadata db empty" });
      } else if (metaDbResposne.status === responseStatus.error) {
        resolve({ status: responseStatus.error, message: "metadata db error" });
      }
      let suiteId = metaDbResposne.data ? metaDbResposne.data.suiteId : null;
      resolve({ status: responseStatus.success, message: "root fetched", data: suiteId, });
    } catch (error) {
      resolve({ status: responseStatus.error, message: "Unexpected error" });
    }
  });
}
function fetchSuites(suiteId) {
  //? returns array of suites at same level
  return new Promise(async (resolve, reject) => {
    if (!suiteId) {
      resolve({ status: responseStatus.error, message: "Bad request" });
    }
    try {
      let suiteObjArray = [];
      let tailSuite = null;
      while (suiteId) {
        let suiteDbResponse = await SUITE_DB.findOne({ _id: suiteId });
        if (suiteDbResponse.status !== responseStatus.success) break;
        suiteObjArray.push(suiteDbResponse.data);
        suiteId = suiteDbResponse.data.next;
        if (suiteId) tailSuite = suiteId; //* _id of last suite child
      }
      resolve({ status: responseStatus.success, message: "Suites fetched", data: suiteObjArray, tailSuite });
    } catch (error) {
      resolve({ status: responseStatus.error, message: "Unexpected error" });
    }
  });
}
function fetchRequests(reqId) {
  //? returns array of request for any given suite
  return new Promise(async (resolve, reject) => {
    if (!reqId) {
      resolve({ status: responseStatus.error, message: "Bad request" });
    }
    try {
      let reqObjArray = [];
      while (reqId) {
        let reqDbResponse = await REQUEST_DB.findOne({ _id: reqId });
        if (reqDbResponse.status !== responseStatus.success) break;
        reqObjArray.push(reqDbResponse.data);
        reqId = reqDbResponse.data.next;
      }
      resolve({ status: responseStatus.success, message: "Request fetched", data: reqObjArray, });
    } catch (error) {
      resolve({ status: responseStatus.error, message: "Unexpected error", error });
    }
  });
}
//! mapping functions
async function getChildSuites(parentId) {
  //? ---- step 2 ----
  let headRes = await getHead(parentId);
  if (headRes.status !== responseStatus.success) return
  let headSuite = headRes.data.headSuite;
  //? ---- step 3 ----
  let xyz = await fetchSuites(headSuite)
  if (xyz.status !== responseStatus.success) return
  return xyz.data; //* array of suites at same level
}
async function getNestedSuites(selectedSuiteId) {
  //? iterates through all the nested suites(children and siblings) of a given suite
  let map = {}; //* path, depth
  let suiteTraversalData = {}; //* id, suiteName

  let treeIterator = async (suiteId, depth, traversalPathArray) => {
    let copyArr = [...traversalPathArray];
    let lastId = copyArr.length ? copyArr[copyArr.length - 1] : suiteId;

    if (!map[lastId]) {
      map[lastId] = {}; //* if no data is stored previously
    }
    map[lastId].path = copyArr; //* adding traversal path to map
    //? --- step 2 &  3 ----
    let childArr = await getChildSuites(suiteId); //* undefined or array of suites at same level
    if (!map[suiteId]) {
      map[suiteId] = {}; //* if no data is  stored previously
    }
    map[suiteId].depth = depth; //* adding node count from root to current position
    depth++;
    if (childArr) {
      //? --- step 4 ----
      for (const child of childArr) {
        traversalPathArray.push(child._id)
        await treeIterator(child._id, depth, traversalPathArray); //* recursive call

        traversalPathArray.pop();
        suiteTraversalData[child._id] = { id: child._id, name: child.suiteName };
      }
    }
  }
  //? ---- step 1 ----
  await treeIterator(selectedSuiteId, 0, [selectedSuiteId]);

  for (const [suite_id, elem] of Object.entries(suiteTraversalData)) {
    let { path, depth } = map[suite_id]
    suiteTraversalData[suite_id].path = path;
    suiteTraversalData[suite_id].depth = depth;
  }
  let suiteDbResponse = await SUITE_DB.findOne({ _id: selectedSuiteId });
  if (suiteDbResponse.status !== responseStatus.success) return;
  const suiteName = suiteDbResponse.data.suiteName;
  suiteTraversalData[selectedSuiteId] = { id: selectedSuiteId, name: suiteName, path: [selectedSuiteId], depth: 0 };
  return suiteTraversalData //* id, suiteName, path, depth
}