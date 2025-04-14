package main

import (
	"bufio"
	"bytes"
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	stdruntime "runtime"
	"strings"
	"syscall"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"github.com/yosuke-furukawa/json5/encoding/json5"
)

type Config struct {
	UIDirectory string `json:"uiDirectory"`

	PalmFolderPath     string `json:"palmFolderPath"`
	PalmInputDataPath  string `json:"palmInputDataPath"`
	PalmOutputDataPath string `json:"palmOutputDataPath"`

	PalmSAAFolderPath     string `json:"palmSAAFolderPath"`
	PalmSAAInputDataPath  string `json:"palmSAAInputDataPath"`
	PalmSAAOutputDataPath string `json:"palmSAAOutputDataPath"`

	PathToValuationConfigs string `json:"pathToValuationConfigs"`
	PathToLiabilityConfigs string `json:"pathToLiabilityConfigs"`
	PathToRiskConfigs      string `json:"pathToRiskConfigs"`
	PathToSAAConfigs       string `json:"pathToSAAConfigs"`

	// scripts to parse output after pALM has been run (resultMergeScenarios.py)
	ScriptsFolderPath           string `json:"scriptsFolderPath"`
	PythonParserScript          string `json:"pythonParserScript"`
	PythonLiabilityConfigScript string `json:"pythonLiabilityConfigScript"`

	GenerateInputFolderPath      string `json:"generateInputFolderPath"`
	GenerateLiabilityConfigPath  string `json:"generateLiabilityConfigPath"`
	GenerateSpreadAssumptionPath string `json:"generateSpreadAssumptionPath"`

	GenerateScenarioConfigPath string `json:"generateScenarioConfigPath"`
	GenerateScenarioPath       string `json:"generateScenarioPath"`
	ScenarioConfigsPath        string `json:"scenarioConfigsPath"`
}

type LiabilityConfig struct {
	SFileName               string  `json:"sFileName"`
	ITimeStep               int     `json:"iTimeStep"`
	ITotalScenarios         int     `json:"iTotalScenarios"`
	IInnerLoopScenariosNum  int     `json:"iInnerLoopScenariosNum"`
	SOutterLoopScenario     string  `json:"sOutterLoopScenario"`
	SInnerLoopScenario      string  `json:"sInnerLoopScenario"`
	SCashPath               string  `json:"sCashPath"`
	SPlanSpecPath           string  `json:"sPlanSpecPath"`
	BRiskN                  bool    `json:"bRiskN"`
	BBasisRisk              bool    `json:"bBasisRisk"`
	BSpousalContinuation    bool    `json:"bSpousalContinuation"`
	BSetBeginningAssetsVM21 bool    `json:"bSetBeginningAssetsVM21"`
	DblBeginningAssetsVM21  float64 `json:"dblBeginningAssetsVM21"`
	AfSpreadSim             float64 `json:"af_spread_sim"`
	BForceNoLapseGMDB       bool    `json:"bForceNoLapseGMDB"`

	SAA1pChange             string    `json:"SAA_1p_change"`
	SAA1pChangeAsset        []string  `json:"SAA_1p_change_asset"`
	SAAShock                []float64 `json:"SAA_shock"`
	SAAParallelChange       string    `json:"SAA_parallel_change"`
	SAAParallelChangeAssets []string  `json:"SAA_parallel_change_assets"`
	SAAParallelShock        []float64 `json:"SAA_parallel_shock"`

	BDeterministicD4D                          bool            `json:"bDeterministicD4D"`
	BUseDFCurve                                bool            `json:"bUseDFCurve"`
	BLiabilityDetailOutput                     bool            `json:"bLiabilityDetailOutput"`
	BDebugger                                  bool            `json:"bDebugger"`
	InvestPortfolio                            string          `json:"invest_portfolio"`
	DblBeta1SpotShock                          float64         `json:"dblBeta1SpotShock"`
	DblBeta2SpotShock                          float64         `json:"dblBeta2SpotShock"`
	DblRNcost                                  float64         `json:"dblRNcost"`
	BuseswapSim                                bool            `json:"buseswap_sim"`
	Dblmeanreversion                           float64         `json:"dblmeanreversion"`
	BStatdiscounting                           bool            `json:"bStatdiscounting"`
	DtStart                                    string          `json:"dtStart"`
	DtValuation                                string          `json:"dtValuation"`
	SLiabilityPath                             string          `json:"sLiabilityPath"`
	BStatPrime                                 bool            `json:"bStatPrime"`
	BAddPremium                                bool            `json:"b_add_premium"`
	BRunSAA                                    bool            `json:"bRunSAA"`
	SAAConfigPath                              string          `json:"SAAConfigPath"`
	AddRiderfeeToNpv                           bool            `json:"add_riderfee_to_npv"`
	Anyuse2SpreadSim                           float64         `json:"anyuse_2_spread_sim"`
	SAASettingPath                             string          `json:"SAASettingPath"`
	BloadScenarioapproch                       bool            `json:"bload_scenarioapproch"`
	DblDiscountSpread                          float64         `json:"dblDiscountSpread"`
	DblMainExpense                             float64         `json:"dblMainExpense"`
	IWithdrawalType                            int             `json:"iWithdrawalType"`
	IDynamicLapseType                          int             `json:"iDynamicLapseType"`
	IAnnuitizationType                         int             `json:"iAnnuitizationType"`
	IMortalityTable                            int             `json:"iMortalityTable"`
	IExpenseType                               int             `json:"iExpense_Type"`
	IDepositeTpye                              int             `json:"iDeposite_Tpye"`
	BExpandContracts                           bool            `json:"bExpandContracts"`
	IOutterWithdrawalType                      int             `json:"iOutterWithdrawalType"`
	IOutterDynamicLapseType                    int             `json:"iOutterDynamicLapseType"`
	IOutterAnnuitizationType                   int             `json:"iOutterAnnuitizationType"`
	IOutterMortalityTable                      int             `json:"iOutterMortalityTable"`
	IOutterExpenseType                         int             `json:"iOutterExpense_Type"`
	IOutterDepositeType                        int             `json:"iOutterDeposite_Type"`
	IVM21Discount                              int             `json:"iVM21_Discount"`
	IProrataLapseType                          int             `json:"iProrataLapseType"`
	DblLapseScaler                             float64         `json:"dblLapseScaler"`
	DblMortalityScaler                         float64         `json:"dblMortalityScaler"`
	BUseCohortTreatyCaps                       bool            `json:"bUseCohortTreatyCaps"`
	BTreatyLevelMinMax                         bool            `json:"bTreatyLevelMinMax"`
	DblInterestRateDelta                       float64         `json:"dblInterestRateDelta"`
	DblEquityDelta                             float64         `json:"dblEquityDelta"`
	DblDeferalMortScaleSim                     float64         `json:"dbl_deferal_mort_scale_sim"`
	DblPayoutMortScaleSim                      float64         `json:"dbl_payout_mort_scale_sim"`
	DblLapseDymItmScaleSim                     float64         `json:"dbl_lapse_dym_itm_scale_sim"`
	DblLapseDymOtmScaleSim                     float64         `json:"dbl_lapse_dym_otm_scale_sim"`
	DblLapseFloorSpreadSim                     float64         `json:"dbl_lapse_floor_spread_sim"`
	DblLsoTakeupScaleSim                       float64         `json:"dbl_lso_takeup_scale_sim"`
	DblIbElectionScaleSim                      float64         `json:"dbl_ib_election_scale_sim"`
	DblProrataWdScaleSim                       float64         `json:"dbl_prorata_wd_scale_sim"`
	DblD4DWdScaleSysSim                        float64         `json:"dbl_d4d_wd_scale_sys_sim"`
	DblD4DWdScaleNonsysSim                     float64         `json:"dbl_d4d_wd_scale_nonsys_sim"`
	DblD4DMigritionScaleSim                    float64         `json:"dbl_d4d_migrition_scale_sim"`
	DblD4DMigritionSpreadSim                   float64         `json:"dbl_d4d_migrition_spread_sim"`
	IpickScenNum                               int             `json:"ipick_scen_num"`
	DblMaxEquityExposure                       float64         `json:"dblMaxEquityExposure"`
	IForceBIGSellMonth                         int             `json:"iForceBIGSellMonth"`
	SCREDITFILE                                string          `json:"sCREDITFILE"`
	SVM20JSONPath                              string          `json:"sVM20_JsonPath"`
	SassetmortportAssumptionPath               string          `json:"sassetmortport_assumption_path"`
	AlternativeReturn                          []float64       `json:"AlternativeReturn"`
	DblExtraspreadReinv                        float64         `json:"dbl_extraspread_reinv"`
	IreinvestChoice                            int             `json:"ireinvest_choice"`
	BReplaceInitialportByReinvport             interface{}     `json:"b_replace_initialport_by_reinvport"`
	BRunAssetCashflow                          interface{}     `json:"b_run_asset_cashflow"`
	AssetPath                                  string          `json:"asset_path"`
	InitialPortGroup                           []int           `json:"initial_port_group"`
	ReinvestPortGroup                          []int           `json:"reinvest_port_group"`
	BStressMortality                           interface{}     `json:"bStress_Mortality"`
	IMortalityType                             int             `json:"iMortalityType"`
	BstressRun                                 interface{}     `json:"bstress_run"`
	IOutterMortalityType                       int             `json:"iOutterMortalityType"`
	SExternalLiabilityPath                     string          `json:"sExternal_liability_path"`
	BDebugInformationALM                       interface{}     `json:"bDebugInformationALM"`
	BRollBVInformationALM                      interface{}     `json:"bRollBVInformationALM"`
	INoEquitySellPeriod                        int             `json:"i_no_equity_sell_period"`
	DblInitialBel                              []float64       `json:"dbl_initial_bel"`
	BdividendMode                              interface{}     `json:"bdividend_mode"`
	DblBscrLevel                               []float64       `json:"dbl_bscr_level"`
	DblOtherExpense                            float64         `json:"dbl_other_expense"`
	BForceBIGSell                              interface{}     `json:"bForceBIGSell"`
	BtaxMode                                   interface{}     `json:"btax_mode"`
	BloadSsEpl                                 interface{}     `json:"bload_ss_epl"`
	BloadGulEpl                                interface{}     `json:"bload_gul_epl"`
	BloadOas                                   interface{}     `json:"bload_oas"`
	Bassetrebalance                            interface{}     `json:"bassetrebalance"`
	RebalanceTimeSchedual                      []int           `json:"rebalance_time_schedual"`
	Irebalancefreq                             int             `json:"irebalancefreq"`
	BexcludeCLOEquity                          interface{}     `json:"bexclude_CLO_equity"`
	Dblswapexpense                             float64         `json:"dblswapexpense"`
	DblLibcfScalar                             float64         `json:"dbl_libcf_scalar"`
	BOnTheFlyGenerator                         interface{}     `json:"bOnTheFlyGenerator"`
	SfinancialmodelConfig                      string          `json:"sfinancialmodel_config"`
	BDividendRestrict                          interface{}     `json:"b_dividend_restrict"`
	DblDividendRestrictionSchedual             []int           `json:"dbl_dividend_restriction_schedual"`
	BReplaceInitportModify                     interface{}     `json:"b_replace_initport_modify"`
	ReinvestPortGroupInner                     []int           `json:"reinvest_port_group_inner"`
	ImprovePathM                               string          `json:"improve_path_m"`
	ImprovePathF                               string          `json:"improve_path_f"`
	DblTaxShock                                float64         `json:"dbl_tax_shock"`
	BloadEplAdhocMode                          bool            `json:"bload_epl_adhoc_mode"`
	SliabInnerCfExternal                       string          `json:"sliab_inner_cf_external"`
	SliabOutterCfExternal                      string          `json:"sliab_outter_cf_external"`
	SScenarioInnerfileExternal                 string          `json:"sScenario_innerfile_external"`
	SScenarioOutterfileExternal                string          `json:"SScenario_outterfile_external"`
	Ishockratesyear                            int             `json:"ishockratesyear"`
	IfinMonth                                  int             `json:"ifin_month"`
	BinnerAssetReserveRun                      bool            `json:"binner_asset_reserve_run"`
	AlternativeReturnInner                     []float64       `json:"AlternativeReturn_inner"`
	DblInnerOtherExpense                       float64         `json:"dbl_inner_other_expense"`
	BScenarioapproachCf                        bool            `json:"bScenarioapproach_cf"`
	DblFxExpense                               float64         `json:"dbl_fx_expense"`
	CorpBlocks                                 []int           `json:"corp_blocks"`
	SNarFiles                                  string          `json:"s_Nar_files"`
	ISimulationLength                          int             `json:"iSimulationLength"`
	ISimYear                                   int             `json:"iSimYear"`
	IUseNestedBelPeriod                        int             `json:"i_use_nested_bel_period"`
	BswapOptimization                          interface{}     `json:"bswap_optimization"`
	DblInnerMaxEquityExposure                  float64         `json:"dbl_inner_MaxEquityExposure"`
	DblInitialBelNoequity                      []float64       `json:"dbl_initial_bel_noequity"`
	ReinvestPortGroupInnerNoequity             []int           `json:"reinvest_port_group_inner_noequity"`
	BrebalanceSellBuy                          interface{}     `json:"brebalance_sell_buy"`
	BFillBscrGap                               interface{}     `json:"b_fill_bscr_gap"`
	BloadDividendArray                         interface{}     `json:"bload_dividend_array"`
	BloadtaxArray                              interface{}     `json:"bloadtax_array"`
	Attributiontype1                           int             `json:"attributiontype_1"`
	Attributiontype2                           int             `json:"attributiontype_2"`
	Attributiontype3                           int             `json:"attributiontype_3"`
	Attributiontype4                           int             `json:"attributiontype_4"`
	Attributiontype5                           int             `json:"attributiontype_5"`
	Attributiontype6                           int             `json:"attributiontype_6"`
	Attributiontype7                           int             `json:"attributiontype_7"`
	Attributiontype8                           int             `json:"attributiontype_8"`
	Attributiontype9                           int             `json:"attributiontype_9"`
	Attributiontype10                          int             `json:"attributiontype_10"`
	Attributiontype11                          int             `json:"attributiontype_11"`
	Attributiontype12                          int             `json:"attributiontype_12"`
	Attributiontype13                          int             `json:"attributiontype_13"`
	Attributiontype14                          int             `json:"attributiontype_14"`
	Attributiontype15                          int             `json:"attributiontype_15"`
	Dbltier1Maxpct                             float64         `json:"dbltier1maxpct"`
	SAATargetPort                              []SAATargetPort `json:"SAA_target_port"`
	SAATargetPortInner                         []SAATargetPort `json:"SAA_target_port_inner"`
	SScenarioInnerfileUpExternal               string          `json:"sScenario_innerfile_up_external"`
	SScenarioInnerfileDownExternal             string          `json:"sScenario_innerfile_down_external"`
	Dblhedgeratio                              []float64       `json:"dblhedgeratio"`
	IntsimStopMtm                              int             `json:"intsim_stop_mtm"`
	SScenarioInnerfileUpLiqExternal            string          `json:"sScenario_innerfile_up_liq_external"`
	SScenarioInnerfileDownLiqExternal          string          `json:"sScenario_innerfile_down_liq_external"`
	InitialBase0Bel                            []float64       `json:"initial_base0_bel"`
	Liqshockarray                              []float64       `json:"liqshockarray"`
	LoadedEquityBel                            []int           `json:"loaded_equity_bel"`
	LoadedNonequityBel                         []int           `json:"loaded_nonequity_bel"`
	LoadedBases0Bel                            []int           `json:"loaded_bases0_bel"`
	BloadGeneratedReserves                     interface{}     `json:"bload_generated_reserves"`
	TaxReserve                                 []float64       `json:"tax_reserve"`
	BtaxReserve                                interface{}     `json:"btax_reserve"`
	SScenarioInnerfileUpLiqExternalShock1      string          `json:"sScenario_innerfile_up_liq_external_shock1"`
	SScenarioInnerfileDownLiqExternalShock1    string          `json:"sScenario_innerfile_down_liq_external_shock1"`
	SScenarioInnerfileUpLiqExternalShock2      string          `json:"sScenario_innerfile_up_liq_external_shock2"`
	SScenarioInnerfileDownLiqExternalShock2    string          `json:"sScenario_innerfile_down_liq_external_shock2"`
	LoadedDividend                             []float64       `json:"loaded_dividend"`
	Anyuse4ScaleSim                            float64         `json:"anyuse_4_scale_sim"`
	BbscrOldRule                               interface{}     `json:"bbscr_old_rule"`
	DblDiscountSpread2                         float64         `json:"dblDiscountSpread_2"`
	BexcludeHyAssetInner                       interface{}     `json:"bexclude_hy_asset_inner"`
	DblIncentiveFee                            float64         `json:"dbl_incentive_fee"`
	DblAlphaPub                                float64         `json:"dbl_alpha_pub"`
	IInnerOtherexpShockType                    int             `json:"i_inner_otherexp_shockType"`
	BSBAInnerDetail                            interface{}     `json:"b_SBA_inner_detail"`
	ISwapWoPd                                  int             `json:"i_swap_wo_pd"`
	IStdApchPd                                 int             `json:"i_std_apch_pd"`
	DblStdApchValue                            []float64       `json:"dbl_std_apch_value"`
	DblStdApchDur                              []float64       `json:"dbl_std_apch_dur"`
	IFctrApchPd                                int             `json:"i_fctr_apch_pd"`
	DblSwapFixAmt                              float64         `json:"dbl_swap_fix_amt"`
	ISwapFixBeg                                int             `json:"i_swap_fix_beg"`
	ISwapFixEnd                                int             `json:"i_swap_fix_end"`
	IuseSimLiqratechargeBegin                  int             `json:"iuse_sim_liqratecharge_begin"`
	IuseSimLiqratechargeEnd                    int             `json:"iuse_sim_liqratecharge_end"`
	BSbaInnerIncentive                         interface{}     `json:"b_sba_inner_incentive"`
	BGradingSens                               interface{}     `json:"b_grading_sens"`
	ScenarioLoader                             string          `json:"ScenarioLoader"`
	BNotchDownRating                           interface{}     `json:"b_notch_down_rating"`
	DblBma258FSpread                           float64         `json:"dbl_bma_258f_spread"`
	BinnerGradingFixedyears                    interface{}     `json:"binner_grading_fixedyears"`
	Bincludebidaskcost                         interface{}     `json:"bincludebidaskcost"`
	BswapSofr                                  interface{}     `json:"bswap_sofr"`
	BsofrCurveSwap                             interface{}     `json:"bsofr_curve_swap"`
	SofrOuter                                  string          `json:"sofr_outer"`
	SofrInner                                  string          `json:"sofr_inner"`
	SofrInnerU25                               string          `json:"sofr_inner_u25"`
	SofrInnerD25                               string          `json:"sofr_inner_d25"`
	SofrInnerLiqup                             string          `json:"sofr_inner_liqup"`
	SofrInnerLiqdown                           string          `json:"sofr_inner_liqdown"`
	SofrInnerLiqupU25                          string          `json:"sofr_inner_liqup_u25"`
	SofrInnerLiqupD25                          string          `json:"sofr_inner_liqup_d25"`
	SofrInnerLiqdownU25                        string          `json:"sofr_inner_liqdown_u25"`
	SofrInnerLiqdownD25                        string          `json:"sofr_inner_liqdown_d25"`
	BrunBmaLiqSize                             interface{}     `json:"brun_bma_liq_size"`
	BmaLiqUpSizeArray                          []float64       `json:"bma_liq_up_size_array"`
	BmaLiqDownSizeArray                        []float64       `json:"bma_liq_down_size_array"`
	BnotchdownOutside                          bool            `json:"bnotchdown_outside"`
	DblInnerBmaSpreadshock                     *[]float64      `json:"dbl_inner_bma_spreadshock"`
	DblLocCost                                 float64         `json:"dbl_loc_cost"`
	ILocPeriod                                 int             `json:"i_loc_period"`
	DblDtaInitial                              float64         `json:"dbl_dta_initial"`
	DblTaxArray                                []float64       `json:"dbl_tax_array"`
	DblBma258FSpreadInner                      float64         `json:"dbl_bma_258f_spread_inner"`
	BaltsBmareturn                             interface{}     `json:"balts_bmareturn"`
	IExpenseTypeInner                          int             `json:"iExpense_Type_inner"`
	Innermaxequity0                            float64         `json:"innermaxequity_0"`
	ReinvestPortGroupInnerAdhoc1               []int           `json:"reinvest_port_group_inner_adhoc1"`
	ReinvestPortGroupInnerAdhoc1Noequity       []int           `json:"reinvest_port_group_inner_adhoc1_noequity"`
	BDragCashRebalance                         bool            `json:"b_drag_cash_rebalance"`
	BrunUniqueCashflowPrismic                  bool            `json:"brun_unique_cashflow_prismic"`
	SbaInnerExpenseShock                       float64         `json:"sba_inner_expense_shock"`
	SbaInnerEquitymean                         float64         `json:"sba_inner_equitymean"`
	SbaInnerEquityvol                          float64         `json:"sba_inner_equityvol"`
	SSVLpath                                   string          `json:"sSVLpath"`
	BidaskcostPublic                           float64         `json:"bidaskcost_public"`
	BidaskcostPublicCLO                        float64         `json:"bidaskcost_publicCLO"`
	BidaskcostFx                               float64         `json:"bidaskcost_fx"`
	BidaskcostSwap                             float64         `json:"bidaskcost_swap"`
	DblInitialRate                             float64         `json:"dblInitialRate"`
	PortfolioRunoff                            float64         `json:"portfolioRunoff"`
	DblSpread                                  float64         `json:"dblSpread"`
	DblMainAUMExpense                          float64         `json:"dblMainAUMExpense"`
	DblOutterLapseScaler                       float64         `json:"dblOutterLapseScaler"`
	BSunriseOnly                               bool            `json:"bSunriseOnly"`
	BTreatyOnlyVM21                            bool            `json:"bTreatyOnlyVM21"`
	ReserveMethod                              int             `json:"ReserveMethod"`
	DblPartialWithdrawal                       float64         `json:"dblPartialWithdrawal"`
	DblParitalWithdrawalEfficiency             float64         `json:"dblParitalWithdrawalEfficiency"`
	DblOutterPartialWithdrawalEfficiencyScaler float64         `json:"dblOutterPartialWithdrawalEfficiencyScaler"`
	BCommuteGMWB                               bool            `json:"bCommuteGMWB"`
	BLoadAAAScenariosfromFile                  bool            `json:"bLoadAAAScenariosfromFile"`
	SAAAScenariofromFile                       string          `json:"sAAAScenariofromFile"`
	ILoadSingleAAA                             int             `json:"iLoadSingleAAA"`
	BLoadAAASequence                           bool            `json:"bLoadAAASequence"`
	ISinglePolicyFilter                        int             `json:"iSinglePolicyFilter"`
	BBestEstimateAssumptions                   bool            `json:"bBestEstimateAssumptions"`
	ILoadSequence                              []int           `json:"iLoadSequence"`
	SMortalityPath                             string          `json:"sMortalityPath"`
	IProjectNum                                int             `json:"iProjectNum"`
	ISeedShift                                 int             `json:"iSeedShift"`
	ISimInterval                               int             `json:"iSimInterval"`
	Dbl3M                                      float64         `json:"dbl3m"`
	Dbl6M                                      float64         `json:"dbl6m"`
	Dbl1Y                                      float64         `json:"dbl1y"`
	Dbl2Y                                      float64         `json:"dbl2y"`
	Dbl3Y                                      float64         `json:"dbl3y"`
	Dbl5Y                                      float64         `json:"dbl5y"`
	Dbl7Y                                      float64         `json:"dbl7y"`
	Dbl10Y                                     float64         `json:"dbl10y"`
	Dbl20Y                                     float64         `json:"dbl20y"`
	Dbl30Y                                     float64         `json:"dbl30y"`
	BSPIACashFlow                              bool            `json:"bSPIACashFlow"`
	DblSpreadOnAnnuitization                   float64         `json:"dblSpreadOnAnnuitization"`
	DblInvestmentExpense                       float64         `json:"dblInvestmentExpense"`
	DblDefaultExpense                          float64         `json:"dblDefaultExpense"`
	DblFixedDiscountRate                       float64         `json:"dblFixedDiscountRate"`
	RWESGSettings                              int             `json:"RW_ESG_Settings"`
	BForceRevenueShare                         bool            `json:"bForceRevenueShare"`
	DblTransactionExpense                      float64         `json:"dblTransactionExpense"`
	C1Riskfactor                               []float64       `json:"c1_riskfactor"`
	BSCRRiskfactor                             [][]float64     `json:"BSCR_riskfactor"`
	ITimeSkip                                  int             `json:"iTimeSkip"`
	BForceSingleThread                         bool            `json:"bForceSingleThread"`
	BShiftTimeSkip                             bool            `json:"bShiftTimeSkip"`
	BCDHS                                      bool            `json:"bCDHS"`
	BAllowProgressBar                          bool            `json:"bAllowProgressBar"`
	BUniqueScenarioSizeTuning                  bool            `json:"bUniqueScenarioSizeTuning"`
	BPolicySampling                            bool            `json:"bPolicySampling"`
	IScenarioPerPolicy                         int             `json:"iScenarioPerPolicy"`
	BMemorySaver                               bool            `json:"bMemorySaver"`
	ICoreThreadOpen                            int             `json:"iCoreThreadOpen"`
	BWeightRun                                 bool            `json:"bWeightRun"`
	BUpDownOff                                 bool            `json:"bUpDownOff"`
	BGMIBForcedUtilization                     bool            `json:"bGMIBForcedUtilization"`
	BOutterGMIBForcedUtilization               bool            `json:"bOutterGMIBForcedUtilization"`
	BGMIBMAXAGEUTILIZATION                     bool            `json:"bGMIBMAXAGEUTILIZATION"`
	BGAPVVM21NOSPREAD                          bool            `json:"bGAPVVM21NOSPREAD"`
	Imortalitycode                             int             `json:"imortalitycode"`
	BTestSpecialMortality                      bool            `json:"bTestSpecialMortality"`
	DblTestMortalityrate                       float64         `json:"dblTestMortalityrate"`
	SRegressionPath                            string          `json:"sRegressionPath"`
	SAnnuityPath                               string          `json:"sAnnuityPath"`
	SSerializedPath                            string          `json:"sSerializedPath"`
	DblCorpYieldBeta                           float64         `json:"dblCorpYieldBeta"`
	DblITMAnnuitizationPower                   float64         `json:"dblITMAnnuitizationPower"`
	DblLapseFloor                              float64         `json:"dblLapseFloor"`
	DblLastCancelUtilization                   float64         `json:"dblLastCancelUtilization"`
	DblLastChanceFactor                        float64         `json:"dblLastChanceFactor"`
	DblMortalityImprovementScaler              float64         `json:"dblMortalityImprovementScaler"`
	DblNRSINonGuaranteeFactor                  int             `json:"dblNRSINonGuaranteeFactor"`
	BAllowFeeResetToMaxGMIB                    bool            `json:"bAllowFeeResetToMaxGMIB"`
	BAnnualAnnuitizationOnly                   bool            `json:"bAnnualAnnuitizationOnly"`
	BExcludeReinsuranceCap                     bool            `json:"bExcludeReinsuranceCap"`
	BForceGMWBACDto115                         bool            `json:"bForceGMWBACDto115"`
	BPayoutExpense                             bool            `json:"bPayoutExpense"`
	BSobolRand                                 bool            `json:"bSobolRand"`
	BSobolShifted                              bool            `json:"bSobolShifted_"`
	BSobolBrownianBridge                       bool            `json:"bSobolBrownianBridge"`
	BSPIAReserve                               bool            `json:"bSPIAReserve"`
	BUniqueScenarioContractTesting             bool            `json:"bUniqueScenarioContractTesting"`
	BUseSerializedResults                      bool            `json:"bUseSerializedResults"`
	BGMWBTakeSPIA                              bool            `json:"bGMWBTakeSPIA"`
	BIgnoreCommission                          bool            `json:"bIgnoreCommission"`
	BLoadTreatyBasedUtilization                bool            `json:"bLoadTreatyBasedUtilization"`
	BMAFCaching                                bool            `json:"bMAFCaching"`
	BNoWithdrawalCohortAdjustment              bool            `json:"bNoWithdrawalCohortAdjustment"`
	BOverrideTargetAllocation                  bool            `json:"bOverrideTargetAllocation"`
	BPayoutImprovement                         bool            `json:"bPayoutImprovement"`
	BUniqueScenarios                           bool            `json:"bUniqueScenarios"`
	DblExpenseFactor                           float64         `json:"dblExpenseFactor"`
	BDemean                                    bool            `json:"bDemean"`
	BDemeanMartingaleAdjustment                bool            `json:"bDemeanMartingaleAdjustment"`
	DblFundDriftAdjustment                     float64         `json:"dblFundDriftAdjustment"`
	BUseBond                                   bool            `json:"bUseBond"`
	ISimulationType                            int             `json:"iSimulationType"`
	BSerializedRollforward                     bool            `json:"bSerializedRollforward"`
	BSerializeOutput                           bool            `json:"bSerializeOutput"`
	Dbl10Yweight                               float64         `json:"dbl10yweight"`
	Dbl1Yweight                                int             `json:"dbl1yweight"`
	Dbl20Yweight                               float64         `json:"dbl20yweight"`
	Dbl30YSwapSpread                           float64         `json:"dbl30ySwapSpread"`
	Dbl30YSwapweight                           float64         `json:"dbl30ySwapweight"`
	Dbl30Yweight                               float64         `json:"dbl30yweight"`
	Dbl5Yweight                                int             `json:"dbl5yweight"`
	DblBeginningBook                           int             `json:"dblBeginningBook"`
	Dbl10YSpread                               float64         `json:"dbl10ySpread"`
	Dbl1YSpread                                float64         `json:"dbl1ySpread"`
	Dbl20YSpread                               float64         `json:"dbl20ySpread"`
	Dbl30YSpread                               float64         `json:"dbl30ySpread"`
	Dbl5YSpread                                float64         `json:"dbl5ySpread"`
	DblC3DiscountRate                          float64         `json:"dblC3DiscountRate"`
	DblCDHSCallOptionVol                       float64         `json:"dblCDHSCallOptionVol"`
	DblCDHSEquityMeanReturn                    float64         `json:"dblCDHSEquityMeanReturn"`
	DblCDHSEquityRateParameters                float64         `json:"dblCDHSEquityRateParameters"`
	DblCDHSInterestRateParamaters              float64         `json:"dblCDHSInterestRateParamaters"`
	DblCorpYieldConstant                       float64         `json:"dblCorpYieldConstant"`
	DblTaxRate                                 float64         `json:"dblTaxRate"`
	IAG43Solve                                 int             `json:"iAG43Solve"`
	IC3P2Solve                                 int             `json:"iC3P2Solve"`
	Taxreserveweight                           float64         `json:"taxreserveweight"`
	BCDHSGPAVDOnly                             bool            `json:"bCDHSGPAVDOnly"`
	BCDHSwithCallOption                        bool            `json:"bCDHSwithCallOption"`
	BFullDeltaCDHS                             bool            `json:"bFullDeltaCDHS"`
	BFullRhoCDHS                               bool            `json:"bFullRhoCDHS"`
	BGPVADOneAsset                             bool            `json:"bGPVADOneAsset"`
	BGPVADwithCDHS                             bool            `json:"bGPVADwithCDHS"`
	BRunGPAVDMatrix                            bool            `json:"bRunGPAVDMatrix "`
	BStandardScenario                          bool            `json:"bStandardScenario"`
	BWorkingReserves                           bool            `json:"bWorkingReserves"`
	CDHSshocktype                              int             `json:"CDHSshocktype"`
	ICDHSDropRecoveryLength                    int             `json:"iCDHSDropRecoveryLength"`
	BQISIINRSIFactors                          bool            `json:"bQISIINRSIFactors"`
	BAG43OnlyOutput                            bool            `json:"bAG43OnlyOutput"`
	BNoMortalityAdjustment                     bool            `json:"bNoMortalityAdjustment"`
	IUpDown                                    int             `json:"iUpDown"`
	BRegressionTest                            bool            `json:"bRegressionTest"`
	DblFXRate                                  int             `json:"dblFXRate"`
	BAgeCalculationALB                         bool            `json:"bAgeCalculationALB"`
	BBeginningMonthMortality                   bool            `json:"bBeginningMonthMortality"`
	BEndofAnniversaryProjection                bool            `json:"bEndofAnniversaryProjection"`
	BExactDate                                 bool            `json:"bExactDate"`
	BFeeAddBackForLapse                        bool            `json:"bFeeAddBackForLapse"`
	BFullCalculation                           bool            `json:"bFullCalculation"`
	BStressLapse                               bool            `json:"bStress_Lapse"`
	BUse22NdTable                              bool            `json:"bUse22ndTable"`
	BUseAgam22NdTable                          bool            `json:"bUseAgam22ndTable"`
	ICurveIntepolationMethod                   int             `json:"iCurveIntepolationMethod"`
	IThreadsForOnTheFlyGenerator               int             `json:"iThreadsForOnTheFlyGenerator"`
	BMonthlyMarketAnnuityFactor                bool            `json:"bMonthlyMarketAnnuityFactor"`
	BPredictiveLapse                           bool            `json:"bPredictiveLapse"`
	BStandardApproachDiscounting               bool            `json:"bStandardApproachDiscounting"`
	Parameters                                 [][]float64     `json:"parameters"`
}

type SAATargetPort struct {
	PublicAgg  float64 `json:"public_agg"`
	PublicBig  float64 `json:"public_big"`
	PrivateAgg float64 `json:"private_agg"`
	PrivateBig float64 `json:"private_big"`
	Clo        float64 `json:"clo"`
	CmlAgg     float64 `json:"cml_agg"`
	CmlBig     float64 `json:"cml_big"`
	CmbsAgg    float64 `json:"cmbs_agg"`
	CmbsBig    float64 `json:"cmbs_big"`
	Equity     float64 `json:"equity"`
	PublicClo  float64 `json:"publicclo"`
	RmbsAgg    float64 `json:"rmbs_agg"`
	RmbsBig    float64 `json:"rmbs_big"`
	Treasury   float64 `json:"treasury"`
	Abs        float64 `json:"abs"`
	Cmo        float64 `json:"cmo"`
	RmbsnAgg   float64 `json:"rmbsn_agg"`
	RmbsnBig   float64 `json:"rmbsn_big"`
	CpAgg      float64 `json:"cp_agg"`
	CpBig      float64 `json:"cp_big"`
}

type LiabilityConfigData struct {
	DirectoryName string
	ConfigData    LiabilityConfig
}

type FileDialogOptions struct {
	SelectDirectory  bool
	DefaultDirectory *string
}

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) ReadUIConfig() (*Config, error) {
	configFilename := "ui_config.json"

	// get current directory
	dir, err := os.Getwd()
	if err != nil {
		fmt.Println("Error:", err)
		return nil, fmt.Errorf("error getting working directory")
	}

	configPath := filepath.Join(dir, configFilename)

	file, err := os.Open(configPath) // For read access.
	if err != nil {
		fmt.Println("Error:", err)
	}
	defer file.Close() // Ensure the file is closed after reading

	// Create an instance of Config to unmarshal the file data into
	var config Config

	// Use json.NewDecoder().Decode() to read and unmarshal the JSON content directly
	decoder := json.NewDecoder(file)
	err = decoder.Decode(&config)
	if err != nil {
		return nil, fmt.Errorf("error decoding JSON: %v", err)
	}

	// Return the config
	return &config, nil
}

func (a *App) GetLiabilityConfigs(folderPath string) ([]LiabilityConfigData, error) {
	var configs []LiabilityConfigData
	// walk through directory
	err := filepath.WalkDir(folderPath, func(path string, dir os.DirEntry, err error) error {
		if err != nil {
			fmt.Println("Error walking through config folder:", err)
			return err
		}

		// check if the current item is a directory
		if dir.IsDir() && path != folderPath {
			liabilityConfigPath := filepath.Join(path, "liability_config.json")

			// check if the liability_config.json file exists
			if _, err := os.Stat(liabilityConfigPath); err == nil {
				// File exists, now open and read it
				file, err := os.Open(liabilityConfigPath)
				if err != nil {
					fmt.Println("Error opening config file:", err)
					return err
				}
				defer file.Close()

				var config LiabilityConfig

				decoder := json5.NewDecoder(file)
				decodeErr := decoder.Decode(&config)
				if decodeErr != nil {
					fmt.Println("Error decoding json file:", decodeErr.Error(), path)
					return decodeErr
				}

				_, marhsallErr := json.MarshalIndent(config, "", "    ")
				if marhsallErr != nil {
					fmt.Println("Error: marshalling file:", marhsallErr)
				}

				// Store the config along with the subdirectory name
				configs = append(configs, struct {
					DirectoryName string
					ConfigData    LiabilityConfig
				}{
					DirectoryName: path,
					ConfigData:    config,
				})
			}
		}
		return nil
	})

	if err != nil {
		return nil, err
	}

	return configs, nil
}

// OpenFileDialog opens a file dialog and returns the selected file or directory path
func (a *App) OpenFileDialog(fileOptions FileDialogOptions) (string, error) {
	options := runtime.OpenDialogOptions{
		Title: "Select a File or Directory",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "All Files (*.*)",
				Pattern:     "*.*",
			},
			{
				DisplayName: "Text Files (*.txt)",
				Pattern:     "*.txt",
			},
		},
	}

	if fileOptions.DefaultDirectory != nil {
		options.DefaultDirectory = *fileOptions.DefaultDirectory
	}

	var filePath string
	var err error

	// if selecting a directory
	if fileOptions.SelectDirectory {
		filePath, err = runtime.OpenDirectoryDialog(a.ctx, options)

		if err != nil {
			runtime.LogError(a.ctx, "Error opening file dialog: "+err.Error())
			return "", err
		}
		runtime.LogInfo(a.ctx, "Selected folder: "+filePath)
	} else {
		filePath, err = runtime.OpenFileDialog(a.ctx, options)

		if err != nil {
			runtime.LogError(a.ctx, "Error opening file dialog: "+err.Error())
			return "", err
		}
		runtime.LogInfo(a.ctx, "Selected file: "+filePath)
	}

	return filePath, nil
}

func (a *App) ExecutePalm(path string, configPath string, configName string) error {

	// get the directory containing the executable
	dir, err := filepath.Abs(filepath.Dir(path))
	if err != nil {
		runtime.LogError(a.ctx, "Error getting directory: "+err.Error())
		return err
	}

	// create the command
	cmd := exec.Command(path, "run", "--config", configPath, "--configname", configName)

	// set the working directory
	cmd.Dir = dir

	// --- Start: Platform-specific code to hide window ---
	if stdruntime.GOOS == "windows" {
		cmd.SysProcAttr = &syscall.SysProcAttr{
			HideWindow:    true,       // This is the crucial flag for Windows
			CreationFlags: 0x08000000, // CREATE_NO_WINDOW - Alternative/additional flag
		}
	}
	// --- End: Platform-specific code ---

	// Create pipes for stdout and stderr
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		runtime.LogError(a.ctx, "Error creating stdout pipe: "+err.Error())
		return err
	}

	stderr, err := cmd.StderrPipe()
	if err != nil {
		runtime.LogError(a.ctx, "Error creating stderr pipe: "+err.Error())
		return err
	}

	// Start the command
	if err := cmd.Start(); err != nil {
		runtime.LogError(a.ctx, "Error starting program: "+err.Error())
		return err
	}

	// Create a function to send events to the frontend
	sendEvent := func(name string, data string) {
		runtime.EventsEmit(a.ctx, name, data)
	}

	// Create a scanner to read stdout line by line
	go func() {
		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			line := scanner.Text()
			sendEvent("stdout", line) // Emit stdout event
		}
		if err := scanner.Err(); err != nil {
			runtime.LogError(a.ctx, "Error reading stdout: "+err.Error())
		}
	}()

	// Create a scanner to read stderr line by line
	go func() {
		scanner := bufio.NewScanner(stderr)
		for scanner.Scan() {
			line := scanner.Text()
			sendEvent("stderr", line) // Emit stderr event
		}
		if err := scanner.Err(); err != nil {
			runtime.LogError(a.ctx, "Error reading stderr: "+err.Error())
		}
	}()

	// Wait for the command to complete
	if err := cmd.Wait(); err != nil {
		runtime.LogError(a.ctx, "Error waiting for program: "+err.Error())
		// Emit a completion event with the error message
		sendEvent("commandCompleted", fmt.Sprintf("Error: %s", err.Error()))
		return err
	}

	// Emit a completion event
	sendEvent("commandCompleted", "Success")
	return nil
}

func (a *App) GetFilenames(path string) ([]string, error) {
	files, err := os.ReadDir(path)
	if err != nil {
		runtime.LogError(a.ctx, "Error reading directory:"+err.Error())
		return nil, err
	}

	filenames := make([]string, 0, len(files))

	for _, file := range files {
		filenames = append(filenames, file.Name())
	}

	return filenames, nil
}

func (a *App) WriteJsonFile(path string, jsonData string) error {
	// Convert the string to a byte slice
	fileContents := []byte(jsonData)

	err := os.WriteFile(path, fileContents, 0644) // Use 0644 permissions
	if err != nil {
		runtime.LogError(a.ctx, "Error writing json file: "+err.Error())
		return err
	}

	return nil
}

type CSVFile struct {
	Path string     // Path to the CSV file
	Name string     // Name of the CSV file
	Data [][]string // Parsed CSV data
}

func (a *App) ReadFiles(path string, filterString string, walkSubdirectories bool) ([]CSVFile, error) {

	// CSVData represents the parsed CSV data as a slice of string slices.
	var result []CSVFile

	// if walkSubDirectories, walk through all files and subdir recursively
	// if false, then just read the main directory
	if walkSubdirectories {
		err := filepath.WalkDir(path, func(fPath string, d os.DirEntry, err error) error {
			if err != nil {
				return err
			}

			// Skip the root directory itself
			if fPath == "." {
				return nil
			}

			fileInfo, err := processFile(fPath, d.Name(), filterString)
			if err != nil {
				runtime.LogErrorf(a.ctx, "Error processing file %s: %v\n", fPath, err)
				return err
			} else if fileInfo != nil {
				result = append(result, *fileInfo)
			}

			return nil
		})

		if err != nil {
			return nil, err
		}

		return result, nil
	} else {

		entries, err := os.ReadDir(path)
		if err != nil {
			runtime.LogError(a.ctx, "Error reading directory"+err.Error())
			return nil, err
		}

		for _, entry := range entries {
			if entry.IsDir() {
				continue // skip
			}

			fullPath := filepath.Join(path, entry.Name())

			fileInfo, err := processFile(fullPath, entry.Name(), filterString)
			if err != nil {
				runtime.LogErrorf(a.ctx, "Error processing file %s: %v\n", fullPath, err)
				continue
			} else if fileInfo != nil {
				result = append(result, *fileInfo)
			}
		}
	}
	return result, nil
}

func processFile(fPath string, fName string, filterString string) (*CSVFile, error) {
	if !strings.HasSuffix(strings.ToLower(fName), ".csv") {
		return nil, nil // not a csv, just skip
	}

	applyFilter := filterString != ""
	passesFilter := true // set to true as default

	if applyFilter {
		passesFilter = strings.Contains(fName, filterString)
	}

	if !passesFilter {
		return nil, nil // not error, just filters out
	}

	// Parse the CSV file
	csvData, err := parseCSVFile(fPath)
	if err != nil {
		return nil, err // Skip to the next file
	}

	// Create a CSVFile struct and append it to the result
	csvFile := CSVFile{
		Path: fPath,
		Name: fName,
		Data: csvData,
	}

	return &csvFile, nil
}

// Helper function to parse a single CSV file
func parseCSVFile(filename string) ([][]string, error) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var buffer bytes.Buffer
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		trimmedLine := strings.TrimRight(line, ",")
		buffer.WriteString(trimmedLine + "\n")
	}

	if err := scanner.Err(); err != nil {
		return nil, err
	}

	reader := csv.NewReader(bytes.NewReader(buffer.Bytes()))
	var data [][]string

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}

		data = append(data, record)
	}

	return data, nil
}

// RunPythonScript runs a Python script with the given parameters and returns its output.
func (a *App) ExecutePythonScript(scriptPath string, params []string) (string, error) {
	cmdParams := append([]string{scriptPath}, params...)
	cmd := exec.Command("python", cmdParams...) // Or "python", depending on your system

	// Set the working directory
	cmd.Dir = filepath.Dir(scriptPath) // Use the directory containing the script

	// --- Start: Platform-specific code to hide window ---
	if stdruntime.GOOS == "windows" {
		cmd.SysProcAttr = &syscall.SysProcAttr{
			HideWindow:    true,       // This is the crucial flag for Windows
			CreationFlags: 0x08000000, // CREATE_NO_WINDOW - Alternative/additional flag
		}
	}
	// --- End: Platform-specific code ---

	output, err := cmd.Output()
	if err != nil {
		// If the command returns an error, try to get more details
		if exitError, ok := err.(*exec.ExitError); ok {
			return "", fmt.Errorf("error running script: %w, stderr: %s", err, string(exitError.Stderr))
		}
		return "", fmt.Errorf("error running script: %w", err)
	}

	fmt.Println(string(output))

	return string(output), nil
}
