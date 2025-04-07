// export type LiabilityConfig = {
//   iProjectNum: number;
//   sFileName: string;
//   sCashPath: string;
//   asset_path: string;
//   sOutterLoopScenario: string;
//   sInnerLoopScenario: string;
//   sLiabilityPath: string;
//   sPlanSpecPath: string;
//   sofr_outer: string;
//   sofr_inner: string;
//   sofr_inner_u25: string;
//   sofr_inner_d25: string;
//   sofr_inner_liqup: string;
//   sofr_inner_liqdown: string;
//   sofr_inner_liqup_u25: string;
//   sofr_inner_liqup_d25: string;
//   sofr_inner_liqdown_u25: string;
//   sofr_inner_liqdown_d25: string;
//   sVM20_JsonPath: string;
// };

export type EmpowerPlanspec = {
  dblMMLapse: number[];
  dblMMBaseLapse: number;
  dblHistoricCompRate: number[];
  dblCompAdd: number[];
  dblNetPricingSpread: number[];
};

// export type UIConfig = {
//   palmFolderPath: string;
//   palmInputDataPath: string;
//   palmOutputDataPath: string;

//   pathToValuationConfigs: string;
//   pathToLiabilityConfigs: string;
//   pathToRiskConfigs: string;
//   pathToSAAConfigs: string;

//   generateInputFilePath: string;
//   generateInputFolderPath: string;
//   generateLiabilityConfigPath: string;
//   generateSpreadAssumptionPath: string;

//   generateScenarioConfigPath: string;
//   generateScenarioPath: string;
//   scenarioConfigsPath: string;

//   parseOutputPath: string;
// };
