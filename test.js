const { responseStatus } = require('./const');

let SuiteData = require('./index.js').SuiteData;

const testModule = async () => {
	// const suiteDataRes = await (new SuiteData({ projectPath: "C:\\Users\\DELL\\Desktop\\request_test" }));
	const suiteDataRes = await new SuiteData({
		projectPath: '/Users/twinklegoyal/Desktop/jetman projects/New_DataStructure',
	});
	if (suiteDataRes.status !== responseStatus.success) {
		console.log('error ....');
		console.error(suiteDataRes);
		return suiteDataRes;
	}
	console.log(suiteDataRes.message);
	const suiteData = suiteDataRes.data;
	await suiteData.initSuites();
	// // await suiteData.setSortedSuiteIds();
	// let sortedSuite = await suiteData.getAllSuiteIds();
	// let sortedSuite = await suiteData.getNestedSortedSuiteIds(['GxaVJDP1l3nmJlmv']);
	// console.log('testModule -> sortedSuite :', sortedSuite);
	// wBm5sptFeN1umK9Y
	let sortedReq = await suiteData.getNestedSortedRequests(['GxaVJDP1l3nmJlmv']);
	// let sortedReq = await suiteData.getSortedRequests(['GxaVJDP1l3nmJlmv']);
	console.log('sortedReq :>> ', sortedReq);
};
testModule();
