import { useState, useEffect } from "react";
import { useUIConfigStore } from "../../stores";
import { main } from "../../../wailsjs/go/models";
import {
  ExecutePythonScript,
  GetFilenames,
  ReadScenarioConfig,
  WriteJsonFile,
} from "../../../wailsjs/go/main/App";

import { cn } from "../../utils/utils";
import { ChevronDown, Check, Plus, Minus } from "lucide-react";
import { LoadingIcon } from "../svgs/LoadingIcon";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Input,
} from "@headlessui/react";
import { Button } from "../ui/Button";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { normalizePathString } from "../../utils/output";

// main.ScenarioConfig is our type

interface InputScenarioConfig extends main.ScenarioConfig {
  spotRates: {
    duration: string;
    sofr: string;
    tr: string;
  }[];
}

const extrapolationOptions = [
  { name: "Flat", id: 0 },
  { name: "FlatForward", id: 1 },
];

const UFRInputs: {
  name: "UFROuter" | "UFROuterStartMonth" | "UFRInner" | "UFRInnerStartMonth";
  id: number;
  inputType: "number";
  disabled: boolean;
}[] = [
  { name: "UFROuter", id: 0, inputType: "number", disabled: false },
  { name: "UFROuterStartMonth", id: 1, inputType: "number", disabled: false },
  { name: "UFRInner", id: 2, inputType: "number", disabled: false },
  { name: "UFRInnerStartMonth", id: 3, inputType: "number", disabled: false },
];

export const Scenarios: React.FC = () => {
  const { config } = useUIConfigStore();
  const { baseScenarioConfigPath, pythonGenerateScenarioScript, scenarioConfigsPath } =
    config;

  const [parent] = useAutoAnimate();
  const [parent2] = useAutoAnimate();
  const [scenarioConfig, setScenarioConfig] = useState<InputScenarioConfig | null>(null);

  const [spotRatesInput, setSpotRatesInput] = useState<
    {
      duration: string;
      sofr: string;
      tr: string;
    }[]
  >([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingScenarios, setIsGeneratingScenarios] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  useEffect(() => {
    const loadScenarioConfig = async () => {
      try {
        setIsLoading(true);
        const config = await ReadScenarioConfig(baseScenarioConfigPath);

        const parsedConfig: InputScenarioConfig = {
          ...config,
          // converting list of numbers into string
          listOfInnerProjectionMonth: [...config.listOfInnerProjectionMonth]
            .map((x) => x.toString())
            .join(", "),
          // converting softSpotRate into better data structure --> spotRates
          spotRates: Object.entries(config.sofrSpotRate).map(([key, value]) => ({
            duration: key,
            sofr: value.toString(),
            tr: config.trSpotRate[key].toString(),
          })),
        };

        setSpotRatesInput(parsedConfig.spotRates);
        setScenarioConfig(parsedConfig);
      } catch (err) {
        console.error(err);
        setError(err as string);
      } finally {
        setIsLoading(false);
      }
    };

    if (baseScenarioConfigPath) {
      loadScenarioConfig();
    }
  }, [baseScenarioConfigPath]);

  // restricting number inputs to only allow numbers
  const handleInputChange = (
    name: keyof main.ScenarioConfig,
    e: React.ChangeEvent<HTMLInputElement>,
    inputType: "number" | "string"
  ) => {
    const { value } = e.target;
    // only allow numbers and one decimal
    if (inputType === "number" && /^\d*\.?\d*$/.test(value)) {
      setScenarioConfig(
        (prev) =>
          prev && {
            ...prev,
            [name]: value,
          }
      );
    }

    if (inputType === "string") {
      setScenarioConfig(
        (prev) =>
          prev && {
            ...prev,
            [name]: value,
          }
      );
    }
  };

  // when changing spot rate input
  const handleSpotRateChange = (
    index: number,
    key: "duration" | "sofr" | "tr",
    value: string
  ) => {
    const copy = [...spotRatesInput];
    const newItem = copy.map((x, i) => (i === index ? { ...x, [key]: value } : x));
    setSpotRatesInput(newItem);
  };

  const handleAddSpotRateItem = () => {
    setSpotRatesInput((prev) => [...prev, { duration: "", sofr: "0", tr: "0" }]);
  };

  const handleRemoveSpotRateItem = (index: number) => {
    const copy = [...spotRatesInput].filter((_, i) => i !== index);
    setSpotRatesInput(copy);
  };

  const handleGenerateScenarios = async () => {
    try {
      setIsGeneratingScenarios(true);
      setError(null);
      setIsCompleted(false);

      if (!scenarioConfig) {
        setError("No config file found");
        return;
      }

      // removing spotRates since we don't need it in final config
      const { spotRates, ...newConfig } = scenarioConfig;

      // remaking scenario config with proper types
      const completedScenarioConfig: main.ScenarioConfig = {
        ...newConfig,
        // converting string back into list of numbers
        listOfInnerProjectionMonth: (scenarioConfig.listOfInnerProjectionMonth as string)
          .split(",")
          .map((x) => parseInt(x)),
        sofrSpotRate: Object.fromEntries(
          spotRatesInput.map((item) => [item.duration, parseFloat(item.sofr)])
        ),
        trSpotRate: Object.fromEntries(
          spotRatesInput.map((item) => [item.duration, parseFloat(item.tr)])
        ),
      };

      const fileNames = await GetFilenames(scenarioConfigsPath);

      // we first make a new config file
      const newConfigFileName = getNextScenarioConfigVersion(fileNames);

      // writing new scenario config file with updated fields
      await WriteJsonFile(
        `${scenarioConfigsPath}/${newConfigFileName}`,
        JSON.stringify(completedScenarioConfig)
      );

      // creating scenario files with python script
      await ExecutePythonScript(normalizePathString(pythonGenerateScenarioScript), [
        newConfigFileName,
      ]);

      setIsCompleted(true);
    } catch (err) {
      setError(err as string);
    } finally {
      setIsGeneratingScenarios(false);
    }
  };

  if (scenarioConfig === null || isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="flex flex-col">
      <div
        className="flex flex-col gap-y-4 min-w-[500px] mt-4 px-5 pt-4 pb-6 bg-dark-700 rounded-lg shadow-lg border border-dark-600"
        ref={parent}
      >
        <div className="flex flex-col gap-y-2">
          <p className="text-sm/6 text-white font-medium">Run Name</p>
          <Input
            value={scenarioConfig.run_id}
            onChange={(e) => handleInputChange("run_id", e, "string")}
            disabled={false}
            className={cn(
              "w-full block rounded-lg border border-dark-600 bg-dark-800 py-1.5 px-3 text-sm/6 text-white pointer-events-auto",
              "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25 disabled:opacity-80"
            )}
          />
        </div>

        <div className="flex flex-col gap-y-2">
          <p className="text-sm/6 text-white font-medium">Extrapolation</p>
          <Listbox
            value={scenarioConfig.Extrapolation}
            onChange={(val) =>
              setScenarioConfig((prev) => prev && { ...prev, Extrapolation: val })
            }
          >
            <ListboxButton
              className={cn(
                "relative block w-full rounded-lg bg-dark-800 py-1.5 pr-8 pl-3 text-left text-sm/6 text-white border border-dark-600",
                "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25"
              )}
            >
              {scenarioConfig?.Extrapolation}
              <ChevronDown className="pointer-events-none absolute top-2.5 right-2.5 size-4 fill-white/60" />
            </ListboxButton>
            <ListboxOptions
              anchor="bottom"
              className={cn(
                "relative w-[var(--button-width)] z-100 my-1 rounded-xl bg-dark-800 border border-dark-600 p-1 focus:outline-none",
                "transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0"
              )}
            >
              {extrapolationOptions.map((option) => (
                <ListboxOption
                  key={option.id}
                  value={option.name}
                  className="flex cursor-default items-center gap-2 rounded-lg py-1.5 px-3 select-none data-[focus]:bg-white/10"
                >
                  <p className="text-sm/6 text-white">{option.name}</p>
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Listbox>
        </div>

        {scenarioConfig?.Extrapolation === "FlatForward" &&
          [...UFRInputs].map((item) => (
            <div className="flex flex-col gap-y-2" key={item.id}>
              <p className="text-sm/6 text-white font-medium">{item.name}</p>
              <Input
                value={scenarioConfig[item.name]}
                onChange={(e) => handleInputChange(item.name, e, item.inputType)}
                disabled={item.disabled}
                className={cn(
                  "w-full block rounded-lg border border-dark-600 bg-dark-800 py-1.5 px-3 text-sm/6 text-white pointer-events-auto",
                  "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25 disabled:opacity-80"
                )}
              />
            </div>
          ))}

        <div className="flex flex-col gap-y-2">
          <p className="text-sm/6 text-white font-medium">
            List Of Inner Projection Months
          </p>
          <Input
            value={scenarioConfig.listOfInnerProjectionMonth}
            onChange={(e) => handleInputChange("listOfInnerProjectionMonth", e, "string")}
            disabled={false}
            className={cn(
              "w-full block rounded-lg border border-dark-600 bg-dark-800 py-1.5 px-3 text-sm/6 text-white pointer-events-auto",
              "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25 disabled:opacity-80"
            )}
          />
        </div>

        <div className="flex flex-col gap-y-2">
          <p className="text-sm/6 text-white font-medium">Tenor Spot Rates</p>
          <div className="border rounded-lg border-dark-600 overflow-hidden">
            <div className="flex text-sm/6 py-1 bg-dark-600 w-full pr-[5%]">
              <p className="w-1/3 text-center">Duration</p>
              <p className="w-1/3 text-center">SOFR Rate</p>
              <p className="w-1/3 text-center">TR Rate</p>
            </div>
            <div className="flex flex-col my-1 divide-y divide-dark-600" ref={parent2}>
              {spotRatesInput.map((item, i) => (
                <div key={i} className="flex py-1">
                  <div className="flex justify-center w-1/3">
                    <Input
                      value={item.duration}
                      onChange={(e) =>
                        handleSpotRateChange(i, "duration", e.currentTarget.value)
                      }
                      disabled={false}
                      className={cn(
                        "w-[100px] block rounded-lg border border-dark-600 bg-dark-800 py-1.5 px-3 text-sm/6 text-white pointer-events-auto",
                        "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25 disabled:opacity-80"
                      )}
                    />
                  </div>
                  <div className="flex justify-center w-1/3">
                    <Input
                      value={item.sofr}
                      onChange={(e) =>
                        handleSpotRateChange(i, "sofr", e.currentTarget.value)
                      }
                      disabled={false}
                      className={cn(
                        "w-[100px] block rounded-lg border border-dark-600 bg-dark-800 py-1.5 px-3 text-sm/6 text-white pointer-events-auto",
                        "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25 disabled:opacity-80"
                      )}
                    />
                  </div>
                  <div className="flex justify-center w-1/3">
                    <Input
                      value={item.tr}
                      onChange={(e) =>
                        handleSpotRateChange(i, "tr", e.currentTarget.value)
                      }
                      disabled={false}
                      className={cn(
                        "w-[100px] block rounded-lg border border-dark-600 bg-dark-800 py-1.5 px-3 text-sm/6 text-white pointer-events-auto",
                        "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25 disabled:opacity-80"
                      )}
                    />
                  </div>
                  <div className="w-[5%] flex justify-center items-center">
                    <Minus
                      className="w-3 h-3 cursor-pointer text-white"
                      onClick={() => handleRemoveSpotRateItem(i)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full flex justify-center cursor-pointer">
            <Plus className="w-5 h-5" onClick={handleAddSpotRateItem} />
          </div>
        </div>
      </div>

      <div className="flex w-full justify-center mt-4 items-center gap-x-2">
        <Button onClick={handleGenerateScenarios} disabled={isGeneratingScenarios}>
          {isGeneratingScenarios ? "Generating" : "Generate Scenarios"}
        </Button>
        {isGeneratingScenarios && <LoadingIcon />}
        {isCompleted && <Check color="green" size={30} className="" />}
      </div>
    </div>
  );
};

const getNextScenarioConfigVersion = (fileNames: string[]): string => {
  const baseName = "config_ESG_OTF";
  const extension = ".json";

  // Find files that match the "config_ESG_OTF" format
  const matchingFiles = fileNames.filter(
    (name) => name.startsWith(baseName) && name.endsWith(extension)
  );

  // Extract versions and find the maximum version number
  const maxVersion = matchingFiles.reduce((max, file) => {
    const match = file.match(/config_ESG_OTF_(\d+)\.json$/);
    const version = match ? parseInt(match[1], 10) : 0;
    return Math.max(max, version);
  }, 0);

  // Construct the next version file name
  const nextVersion = maxVersion + 1;
  return `${baseName}_${nextVersion}${extension}`;
};
