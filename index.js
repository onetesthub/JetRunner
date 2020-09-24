const { responseStatus } = require('./const');
let initProject = require('./dbFunctions');
let { fetchRequests, getRootSuites, getNestedSuites, getHead } = initProject({ projectPath: "C:\\Users\\DELL\\Desktop\\request_test" });
class SuiteData {
  constructor({ projectPath }) {
    this.projectPath = projectPath;
    this.desiredSuiteIds = [];
    this.allSuiteIds = [];
  }

  getSortedSuiteIds() {
    return this.desiredSuiteIds;
  }

  setSortedSuiteIds(desiredSuiteIds) {
    if (!desiredSuiteIds) {
      this.desiredSuiteIds = this.getAllSuiteIds();
    } else {
      let filteredArray = [];
      //* filter desired suite IDs
      let allSuiteIds = this.getAllSuiteIds();
      for (const suiteId of allSuiteIds) {
        for (const match of desiredSuiteIds) {
          if (suiteId === match) {
            filteredArray.push(suiteId);
          }
        }
      }
      this.desiredSuiteIds = filteredArray;
    }
  }

  getAllSuiteIds() {
    return this.allSuiteIds;
  }

  async initSuites() {
    let suiteRes = await getRootSuites();
    if (suiteRes.status === responseStatus.success) {
      let rootSuites = suiteRes.data;
      for (const rootSuite of rootSuites) {
        const nestedSuitesMap = await getNestedSuites(rootSuite._id);
        let nestedSuiteIds = Object.keys(nestedSuitesMap);
        for (const nestedSuiteId of nestedSuiteIds) {
          this.allSuiteIds.push(nestedSuiteId);
          this.desiredSuiteIds.push(nestedSuiteId);
        }
      }
    }
  }

  async getSortedRequests(desiredSuiteIds) {
    if (desiredSuiteIds) this.setSortedSuiteIds(desiredSuiteIds);
    let filteredSuiteIds = this.getSortedSuiteIds();
    let sortedReqArray = [];
    for (const suiteId of filteredSuiteIds) {
      let headRes = await getHead(suiteId);
      if (headRes.status !== responseStatus.success) return;
      let { headReq } = headRes.data;
      if (!headReq) continue
      let requestsOfSuite = await fetchRequests(headReq);
      if (requestsOfSuite.status === responseStatus.success) {
        for (const req of requestsOfSuite.data) {
          let reqDetail = { suiteId, req };//! suiteid, name, path, req
          sortedReqArray.push(reqDetail)
        }
      }
    }
    return sortedReqArray;
  }

  async getNestedSortedSuiteIds(desiredSuiteIds) {
    let sortedSuiteArray = [];
    for (const suiteId of desiredSuiteIds) {
      const nestedSuitesMap = await getNestedSuites(suiteId);
      let nestedSuiteIds = Object.keys(nestedSuitesMap);
      sortedSuiteArray = [...sortedSuiteArray, ...nestedSuiteIds];
    }
    await this.setSortedSuiteIds(sortedSuiteArray);
    return this.getSortedSuiteIds();
  }

  async getNestedSortedRequests(desiredSuiteIds) {
    let sortedSuiteIds = await this.getNestedSortedSuiteIds(desiredSuiteIds);
    let sortedReq = await this.getSortedRequests(sortedSuiteIds);
    return sortedReq;
  }
}
//! init class
const testModule = async () => {
  const suiteData = new SuiteData({ projectPath: "C:\\Users\\DELL\\Desktop\\request_test" });
  await suiteData.initSuites();
  // await suiteData.setSortedSuiteIds();

  let sortedSuite = suiteData.getSortedSuiteIds();
  // let sortedReq = await suiteData.getNestedSortedRequests(['i0i1QsukBDrEOoMa']);
  let sortedReq = await suiteData.getSortedRequests(['i0i1QsukBDrEOoMa']);
  console.log("sortedReq :>> ", sortedReq);
}