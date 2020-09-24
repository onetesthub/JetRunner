//! get root suites
const { getRootSuiteId, getRootSuites, fetchRequests, getHead } = require('./dbFunctions');
const { responseStatus } = require('./const');
const getSuiteMap = require('./getSuiteMap');
//! ================================================
const getSuitesMap = (suiteArray) => {
  //? INPUT -> optional => [ ID of suites to map ]
  //? RETURN false || map to suites provided or map of all suites in the project (if no input) 
  return new Promise(async (resolve, reject) => {
    try {
      if (!suiteArray) {
        let suiteRes = await getRootSuites();
        if (suiteRes.status === responseStatus.success) {
          suiteArray = suiteRes.data;
        } else {
          resolve(false);
        }
      }
      let suitesMap;
      for (const suite of suiteArray) {
        let headRes = await getHead(suite._id);
        if (headRes.status !== responseStatus.success) resolve(false)
        let { headReq } = headRes.data;
        if (!headReq) continue
        // let requestOfSuite = await fetchRequests(headReq);
        let temp = await getSuiteMap(suite._id);
        suitesMap = { ...suitesMap, [suite._id]: { ...temp, request: requestOfSuite.data } };
      }
      resolve({ status: responseStatus.success, data: suitesMap });
    } catch (error) {
      console.error(error);
      resolve({ status: responseStatus.error });
    }
  });
};

(async () => {
  let xyz = await getSuitesMap();
  for (const key in xyz.data) {
    if (xyz.data.hasOwnProperty(key)) {
      const element = xyz.data[key];
      console.log('element :>> ', element.request);
    }
  }
})()

/*
  function 0
    input -> project name || project ID || path
    task -> init project 

  function 1
    case 1:
      input -> [ suite ID ]
      output ->. [ ID of given suites in rinning order ]
    case 2:
      input ->
      output ->. [ ID of suites in project ]

  function 2
    input -> 
    task -> 
    output -> { Id and data of suites in runnin order, [ request object ] }

*/
module.exports = { getSuitesMap };