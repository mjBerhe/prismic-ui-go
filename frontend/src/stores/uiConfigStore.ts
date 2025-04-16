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
    pythonLiabilityConfigScript: "",

    baseScenarioConfigPath: "", // base scenario ESG config file
    scenarioConfigsPath: "", // directory where the ESG config files live
    pythonGenerateScenarioScript: "", // script to create scenario files from scenario config

    generateLiabilityConfigPath: "",
    generateSpreadAssumptionPath: "",
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
