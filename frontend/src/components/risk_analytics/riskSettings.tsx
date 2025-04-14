import { useState, useEffect } from "react";
import { OpenFileDialog } from "../../../wailsjs/go/main/App";

import {
  Input,
  Listbox,
  ListboxOption,
  ListboxOptions,
  ListboxButton,
} from "@headlessui/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { cn } from "../../utils/utils";
import { FolderInput, ChevronDown, Info } from "lucide-react";
import { getRelativePath } from "../../utils/output";
import { ConfigOption } from "../../roots/valuation";
import { useLiabilityConfigStore, useUIConfigStore } from "../../stores";

type ConfigInput =
  | "sFileName"
  | "sCashPath"
  | "sPlanSpecPath"
  | "sVM20_JsonPath"
  | "asset_path";

type FolderType = "input" | "input/liability" | "input/scenarios" | "output";

const configInputs: {
  key: ConfigInput;
  displayName: string;
  validationType: "file" | "folder" | "string";
  folderType?: FolderType;
  description: string;
}[] = [
  {
    key: "sFileName",
    displayName: "Output File Name",
    validationType: "string",
    description: "Name for this specific pALM run",
  },
  {
    key: "sCashPath",
    displayName: "Output Path",
    validationType: "folder",
    folderType: "output",
    description: "Folder path where the output files will be saved",
  },
  {
    key: "asset_path",
    displayName: "Initial Portfolio",
    validationType: "file",
    folderType: "input",
    description: "Initial asset tape",
  },
  {
    key: "sVM20_JsonPath",
    displayName: "Spread, Default Cost, Investment Expense",
    validationType: "file",
    folderType: "input",
    description:
      "File containing credit spread (current and long term), default expense, and investment expense",
  },
];

const scenarioKeys = new Set([
  "sofr_outer",
  "sofr_inner",
  "sofr_inner_u25",
  "sofr_inner_d25",
  "sofr_inner_liqup",
  "sofr_inner_liqdown",
  "sofr_inner_liqup_u25",
  "sofr_inner_liqup_d25",
  "sofr_inner_liqdown_u25",
  "sofr_inner_liqdown_d25",
  "sOutterLoopScenario",
  "sInnerLoopScenario",
  "sScenario_innerfile_external",
  "SScenario_outterfile_external",
  "sScenario_innerfile_up_external",
  "sScenario_innerfile_down_external",
  "sScenario_innerfile_up_liq_external",
  "sScenario_innerfile_down_liq_external",
  "sScenario_innerfile_up_liq_external_shock1",
  "sScenario_innerfile_down_liq_external_shock1",
  "sScenario_innerfile_up_liq_external_shock2",
  "sScenario_innerfile_down_liq_external_shock2",
]);

const IS_DEMO = false;

export const RiskSettings: React.FC<{
  configPath: string;
  palmFolderPath: string;
  isPalmRunning?: boolean;
  configOptions: ConfigOption[];
}> = ({ configPath, palmFolderPath, configOptions }) => {
  const { config, setConfig, setConfigPath } = useLiabilityConfigStore();
  const { config: uiConfig } = useUIConfigStore();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<ConfigOption>(configOptions[0]);
  const [scenarioFolderPath, setScenarioFolderPath] = useState<string>("");

  useEffect(() => {
    if (configOptions.length > 0) {
      // syncing selected config with preselected config from risk-analytics.tsx
      setSelectedConfig(configOptions[0]);
    }
  }, [configOptions]);

  useEffect(() => {
    if (config) {
      // TODO: cleanup scenario path code
      const scenarioExample = config.sofr_outer;
      const match = scenarioExample?.match(/^(.*scenarios\/[^/]+\/)/);
      const scenarioPath = match ? match[1] : null;
      if (scenarioPath) {
        setScenarioFolderPath(scenarioPath);
      }
    }
  }, [config]);

  const handleChangeConfig = (value: ConfigOption) => {
    setSelectedConfig(value);
    value.configJson && setConfig(value.configJson);
    value.path && setConfigPath(value.path);
  };

  const defaultFolderPathMap: Record<FolderType, string> = {
    input: uiConfig.palmInputDataPath,
    "input/liability": `${uiConfig.palmInputDataPath}/liability`,
    "input/scenarios": `${uiConfig.palmInputDataPath}/scenarios`,
    output: uiConfig.palmOutputDataPath,
  };

  const handleSelectFile = async (
    key: ConfigInput | "scenarioFolderPath",
    type: "file" | "folder",
    folderType?: FolderType
  ) => {
    try {
      const result = await OpenFileDialog({
        DefaultDirectory: folderType ? defaultFolderPathMap[folderType] : "",
        SelectDirectory: type === "folder" ? true : false,
      });
      const relativeFilePath = result && getRelativePath(palmFolderPath, result);
      if (relativeFilePath) {
        if (key === "scenarioFolderPath") {
          setScenarioFolderPath(relativeFilePath);

          const scenarioFolderName = relativeFilePath.match(/scenarios\/([^/]+)/)?.[1];
          if (scenarioFolderName) {
            const newScenarioPaths = Object.fromEntries(
              Object.entries(config).map(([key, value]) => {
                // Only modify keys present in `scenarioKeys` and of type `string`
                if (scenarioKeys.has(key) && typeof value === "string") {
                  return [
                    key,
                    value.replace(/(scenarios\/)[^/]+/, `$1${scenarioFolderName}`),
                  ];
                }
                return [key, value];
              })
            );
            setConfig({
              ...newScenarioPaths,
            });
          }
        } else {
          setConfig({
            [key]: type === "folder" ? relativeFilePath + "/" : relativeFilePath,
          });
        }
      }
    } catch (error) {
      console.error("Error opening file dialog:", error);
    }
  };

  return (
    <div className="w-full flex flex-col">
      <h1 className="text-xl font-semibold">Settings</h1>

      <div className="flex flex-col gap-y-4 mt-4 px-5 pt-4 pb-6 bg-dark-700 rounded-lg shadow-lg border border-dark-600">
        <div className="flex flex-col w-full gap-y-2">
          <p className="text-sm/6 text-white font-medium">Select Config Folder</p>
          <div className="flex gap-x-2 items-center">
            <Listbox value={selectedConfig} onChange={(val) => handleChangeConfig(val)}>
              <ListboxButton
                className={cn(
                  "relative block w-full rounded-lg bg-dark-800 py-1.5 pr-8 pl-3 text-left text-sm/6 text-white border border-dark-600",
                  "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25"
                )}
              >
                {selectedConfig.name}
                <ChevronDown className="pointer-events-none absolute top-2.5 right-2.5 size-4 fill-white/60" />
              </ListboxButton>
              <ListboxOptions
                anchor="bottom"
                className={cn(
                  "relative w-[var(--button-width)] z-100 my-1 rounded-xl bg-dark-800 border border-dark-600 p-1 focus:outline-none",
                  "transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0"
                )}
              >
                {configOptions.map((option) => (
                  <ListboxOption
                    key={option.id}
                    value={option}
                    className="flex cursor-default items-center gap-2 rounded-lg py-1.5 px-3 select-none data-[focus]:bg-white/10"
                  >
                    <p className="text-sm/6 text-white">{option.name}</p>
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </Listbox>
            <p className="w-[48px]"></p>
          </div>
        </div>

        {configInputs.map((x) => (
          <div key={x.key} className="flex flex-col w-full gap-y-2">
            <div className="flex gap-x-2 items-center">
              <p className="text-sm/6 text-white font-medium">{x.displayName}</p>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger>
                    <Info size={18} className="text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="bg-black text-sm px-3 py-2 rounded-xl text-gray-300">
                      {x.description}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex gap-x-2 items-center">
              <Input
                value={config[x.key] || ""}
                onChange={(e) => setConfig({ [x.key]: e.target.value })}
                disabled={
                  x.validationType === "file" || x.validationType === "folder" || IS_DEMO
                }
                className={cn(
                  "w-full block rounded-lg border border-dark-600 bg-dark-800 py-1.5 px-3 text-sm/6 text-white pointer-events-auto",
                  "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25 disabled:opacity-80"
                )}
              />
              {x.validationType === "file" || x.validationType === "folder" ? (
                <FolderInput
                  onClick={() =>
                    handleSelectFile(
                      x.key,
                      x.validationType as "file" | "folder",
                      x.folderType
                    )
                  }
                  className={cn("cursor-pointer w-[48px]", IS_DEMO && "text-gray-500")}
                />
              ) : (
                <p className="w-[48px]"></p>
              )}
            </div>
          </div>
        ))}

        {scenarioFolderPath && (
          <div className="flex flex-col w-full gap-y-2">
            <div className="flex gap-x-2 items-center">
              <p className="text-sm/6 text-white font-medium">Scenario Path</p>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger>
                    <Info size={18} className="text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="bg-black text-sm px-3 py-2 rounded-xl text-gray-300">
                      Folder path containing the set of the scenarios
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex gap-x-2 items-center">
              <Input
                value={scenarioFolderPath}
                onChange={() => {}}
                disabled={true}
                className={cn(
                  "w-full block rounded-lg border border-dark-600 bg-dark-800 py-1.5 px-3 text-sm/6 text-white pointer-events-auto",
                  "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25 disabled:opacity-80"
                )}
              />
              <FolderInput
                onClick={() =>
                  handleSelectFile("scenarioFolderPath", "folder", "input/scenarios")
                }
                className={cn("cursor-pointer w-[48px]", IS_DEMO && "text-gray-500")}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
