export namespace main {
	
	export class Config {
	    palmFolderPath: string;
	    palmInputDataPath: string;
	    palmOutputDataPath: string;
	    pathToValuationConfigs: string;
	    pathToLiabilityConfigs: string;
	    pathToRiskConfigs: string;
	    generateInputFilePath: string;
	    generateInputFolderPath: string;
	    generateLiabilityConfigPath: string;
	    generateSpreadAssumptionPath: string;
	    generateScenarioConfigPath: string;
	    generateScenarioPath: string;
	    scenarioConfigsPath: string;
	    parseOutputPath: string;
	    baseLiabilityConfigPath: string;
	    baseSpreadAssumptionPath: string;
	
	    static createFrom(source: any = {}) {
	        return new Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.palmFolderPath = source["palmFolderPath"];
	        this.palmInputDataPath = source["palmInputDataPath"];
	        this.palmOutputDataPath = source["palmOutputDataPath"];
	        this.pathToValuationConfigs = source["pathToValuationConfigs"];
	        this.pathToLiabilityConfigs = source["pathToLiabilityConfigs"];
	        this.pathToRiskConfigs = source["pathToRiskConfigs"];
	        this.generateInputFilePath = source["generateInputFilePath"];
	        this.generateInputFolderPath = source["generateInputFolderPath"];
	        this.generateLiabilityConfigPath = source["generateLiabilityConfigPath"];
	        this.generateSpreadAssumptionPath = source["generateSpreadAssumptionPath"];
	        this.generateScenarioConfigPath = source["generateScenarioConfigPath"];
	        this.generateScenarioPath = source["generateScenarioPath"];
	        this.scenarioConfigsPath = source["scenarioConfigsPath"];
	        this.parseOutputPath = source["parseOutputPath"];
	        this.baseLiabilityConfigPath = source["baseLiabilityConfigPath"];
	        this.baseSpreadAssumptionPath = source["baseSpreadAssumptionPath"];
	    }
	}

}

