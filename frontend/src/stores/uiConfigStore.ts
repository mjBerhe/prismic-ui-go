import { create } from "zustand";
import { main } from "../../wailsjs/go/models";

type UIConfigStore = {
  config: main.Config;
  setConfig: (config: main.Config) => void;
};

const useUIConfigStore = create<UIConfigStore>((set) => ({
  config: {
    uiDirectory: "",

    palmFolderPath: "",
    palmInputDataPath: "",
    palmOutputDataPath: "",

    palmSAAFolderPath: "",
    palmSAAInputDataPath: "",
    palmSAAOutputDataPath: "",

    pathToValuationConfigs: "",
    pathToLiabilityConfigs: "",
    pathToRiskConfigs: "",
    pathToSAAConfigs: "",

    scriptsFolderPath: "",
    pythonParserScript: "", // new script to parse output after pALM is ran

    generateInputFolderPath: "",
    generateLiabilityConfigPath: "",
    generateSpreadAssumptionPath: "",

    generateScenarioConfigPath: "",
    generateScenarioPath: "",
    scenarioConfigsPath: "",

    baseLiabilityConfigPath: "",
    baseSpreadAssumptionPath: "",
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
