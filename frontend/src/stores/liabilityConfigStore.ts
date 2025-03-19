import { create } from "zustand";
import type { LiabilityConfig } from "../types/pages";

type ConfigStore = {
  config: LiabilityConfig;
  configPath: string;
  setConfig: (newConfig: Partial<LiabilityConfig>) => void;
  setConfigPath: (path: string) => void;
};

const useLiabilityConfigStore = create<ConfigStore>((set) => ({
  config: {
    iProjectNum: 0,
    sFileName: "",
    sFolderName: "",
    MultiProjectSettings: {
      PortfolioPath: "",
      sLiabilityPath: "",
    },
    sCashPath: "",
    asset_path: "",
    sOutterLoopScenario: "",
    sInnerLoopScenario: "",
    sLiabilityPath: "",
    sPlanSpecPath: "",
    sofr_outer: "",
    sofr_inner: "",
    sofr_inner_u25: "",
    sofr_inner_d25: "",
    sofr_inner_liqup: "",
    sofr_inner_liqdown: "",
    sofr_inner_liqup_u25: "",
    sofr_inner_liqup_d25: "",
    sofr_inner_liqdown_u25: "",
    sofr_inner_liqdown_d25: "",
    sVM20_JsonPath: "",
  },
  configPath: "",
  setConfig: (newConfig) =>
    set((state) => ({
      ...state,
      config: {
        ...state.config,
        ...newConfig,
      },
    })),
  setConfigPath: (path) =>
    set((state) => ({
      ...state,
      configPath: path,
    })),
}));

export default useLiabilityConfigStore;
