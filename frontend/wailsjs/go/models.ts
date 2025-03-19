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
	export class FileDialogOptions {
	    SelectDirectory: boolean;
	    DefaultDirectory?: string;
	
	    static createFrom(source: any = {}) {
	        return new FileDialogOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.SelectDirectory = source["SelectDirectory"];
	        this.DefaultDirectory = source["DefaultDirectory"];
	    }
	}
	export class MultiProjectSettings {
	    PortfolioPath: string;
	    sLiabilityPath: string;
	
	    static createFrom(source: any = {}) {
	        return new MultiProjectSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.PortfolioPath = source["PortfolioPath"];
	        this.sLiabilityPath = source["sLiabilityPath"];
	    }
	}
	export class LiabilityConfig {
	    iProjectNum: number;
	    sFileName: string;
	    sFolderName: string;
	    MultiProjectSettings: MultiProjectSettings;
	    sCashPath: string;
	    asset_path: string;
	    sOutterLoopScenario: string;
	    sInnerLoopScenario: string;
	    sLiabilityPath: string;
	    sPlanSpecPath: string;
	    sofr_outer: string;
	    sofr_inner: string;
	    sofr_inner_u25: string;
	    sofr_inner_d25: string;
	    sofr_inner_liqup: string;
	    sofr_inner_liqdown: string;
	    sofr_inner_liqup_u25: string;
	    sofr_inner_liqup_d25: string;
	    sofr_inner_liqdown_u25: string;
	    sofr_inner_liqdown_d25: string;
	    sVM20_JsonPath: string;
	
	    static createFrom(source: any = {}) {
	        return new LiabilityConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.iProjectNum = source["iProjectNum"];
	        this.sFileName = source["sFileName"];
	        this.sFolderName = source["sFolderName"];
	        this.MultiProjectSettings = this.convertValues(source["MultiProjectSettings"], MultiProjectSettings);
	        this.sCashPath = source["sCashPath"];
	        this.asset_path = source["asset_path"];
	        this.sOutterLoopScenario = source["sOutterLoopScenario"];
	        this.sInnerLoopScenario = source["sInnerLoopScenario"];
	        this.sLiabilityPath = source["sLiabilityPath"];
	        this.sPlanSpecPath = source["sPlanSpecPath"];
	        this.sofr_outer = source["sofr_outer"];
	        this.sofr_inner = source["sofr_inner"];
	        this.sofr_inner_u25 = source["sofr_inner_u25"];
	        this.sofr_inner_d25 = source["sofr_inner_d25"];
	        this.sofr_inner_liqup = source["sofr_inner_liqup"];
	        this.sofr_inner_liqdown = source["sofr_inner_liqdown"];
	        this.sofr_inner_liqup_u25 = source["sofr_inner_liqup_u25"];
	        this.sofr_inner_liqup_d25 = source["sofr_inner_liqup_d25"];
	        this.sofr_inner_liqdown_u25 = source["sofr_inner_liqdown_u25"];
	        this.sofr_inner_liqdown_d25 = source["sofr_inner_liqdown_d25"];
	        this.sVM20_JsonPath = source["sVM20_JsonPath"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class LiabilityConfigData {
	    DirectoryName: string;
	    ConfigData: LiabilityConfig;
	
	    static createFrom(source: any = {}) {
	        return new LiabilityConfigData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.DirectoryName = source["DirectoryName"];
	        this.ConfigData = this.convertValues(source["ConfigData"], LiabilityConfig);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

