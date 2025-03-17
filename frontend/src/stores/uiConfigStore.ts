import { create } from "zustand";
import type { UIConfig } from "../types/pages";

type UIConfigStore = {
  config: UIConfig;
  setConfig: (config: UIConfig) => void;
};

const useUIConfigStore = create<UIConfigStore>((set) => ({
  config: {
    palmFolderPath: "",
    palmInputDataPath: "",
    palmOutputDataPath: "",
    pathToValuationConfigs: "",
    pathToLiabilityConfigs: "",
    pathToRiskConfigs: "",
    generateInputFilePath: "",
    generateInputFolderPath: "",
    generateLiabilityConfigPath: "",
    generateSpreadAssumptionPath: "",
    parseOutputPath: "",
    generateScenarioConfigPath: "",
    generateScenarioPath: "",
    scenarioConfigsPath: "",
  },
  setConfig: (uiConfig) =>
    set((state) => ({
      ...state,
      config: {
        ...uiConfig,
      },
    })),
}));

export default useUIConfigStore;
