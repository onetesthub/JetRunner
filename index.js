const { responseStatus } = require('./const');
const initProject = require('./dbFunctions');
const fs = require('fs');
const path = require('path');

class SuiteData {
	constructor({ projectPath }) {
		return new Promise((resolve, reject) => {
			this.bootstrapProjectt(projectPath)
				.then((status) => {
					if (status.status === responseStatus.success) {
						resolve({ ...status, data: this });
					} else {
						resolve(status);
					}
				})
				.catch((err) => {
					console.log(err);
					resolve({
						status: responseStatus.error,
						message: 'Run tim exception during initilization',
					});
				});
		});
	}
	bootstrapProjectt(projectPath) {
		return new Promise((resolve, reject) => {
			try {
				if (!projectPath) return { status: responseStatus.empty, message: 'Path not defined' };
				let metaFilePath = path.join(projectPath, 'metaInfo.db');
				// Check if the file exists in the current directory.
				fs.access(metaFilePath, fs.constants.F_OK, (err) => {
					if (err) {
						resolve({ status: responseStatus.error, message: 'Valid Jetman project not found' });
					} else {
						fs.access(metaFilePath, fs.constants.R_OK, (err) => {
							if (err) {
								resolve({
									status: responseStatus.error,
									message: "Given Jetman project doesn't have read permission",
								});
							} else {
								this.projectPath = projectPath;
								this.dbFunctions = initProject({ projectPath });
								this.desiredSuiteIds = [];
								this.allSuiteIds = [];
								resolve({
									status: responseStatus.success,
									message: 'Project successfully Bootstrapped',
								});
							}
						});
					}
				});
			} catch (e) {
				console.log('e :>> ', e);
				resolve({ status: responseStatus.error, message: 'Unexpected Error' });
			}
		});
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
		let suiteRes = await this.dbFunctions.getRootSuites();
		if (suiteRes.status === responseStatus.success) {
			let rootSuites = suiteRes.data;
			for (const rootSuite of rootSuites) {
				const nestedSuitesMap = await this.dbFunctions.getNestedSuites(rootSuite._id);
				let nestedSuiteIds = Object.keys(nestedSuitesMap);
				for (const nestedSuiteId of nestedSuiteIds) {
					this.allSuiteIds.push(nestedSuiteId);
					this.desiredSuiteIds.push(nestedSuiteId);
				}
			}
		}
	}

	async getSuiteObj() {}

	async getSortedRequests(desiredSuiteIds) {
		if (desiredSuiteIds) this.setSortedSuiteIds(desiredSuiteIds);
		let filteredSuiteIds = this.getSortedSuiteIds();
		let sortedReqArray = [];
		for (const suiteId of filteredSuiteIds) {
			let headRes = await this.dbFunctions.getHead(suiteId);
			if (headRes.status !== responseStatus.success) return;
			let { headReq } = headRes.data;
			if (!headReq) continue;
			let requestsOfSuite = await this.dbFunctions.fetchRequests(headReq);
			if (requestsOfSuite.status === responseStatus.success) {
				for (const req of requestsOfSuite.data) {
					let suiteRes = await this.dbFunctions.getSuiteNameById(suiteId);
					if (!suiteRes) console.error('error');
					const suiteid = req.parent;
					const reqName = req.reqName;
					if (req.parent) delete req.parent;
					if (req.reqName) delete req.reqName;
					let reqDetail = { suiteName: suiteRes, suiteId: suiteid, reqName, req }; //! suiteid, name, path, req
					sortedReqArray.push(reqDetail);
				}
			}
		}
		return sortedReqArray;
	}

	async getNestedSortedSuiteIds(desiredSuiteIds) {
		let sortedSuiteArray = [];
		for (const suiteId of desiredSuiteIds) {
			const nestedSuitesMap = await this.dbFunctions.getNestedSuites(suiteId);
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

	async getAllEnvironments() {
		let envRes = await this.dbFunctions.getAllEnvironments();
		if (envRes === false) return false;
		if (envRes.status === responseStatus.success)
			return { status: 'success', message: 'Data fetched', data: envRes.data };
	}

	async getAllRootSuites() {
		let rootSuitesRes = await this.dbFunctions.getRootSuites();
		if (rootSuitesRes === false) return false;
		if (rootSuitesRes.status === responseStatus.success)
			return { status: 'success', message: 'Data fetched', data: rootSuitesRes.data };
	}
}

module.exports = { SuiteData: SuiteData };
