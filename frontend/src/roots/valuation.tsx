import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import JSON5 from "json5";
import { cleanJsonString, normalizePathString, resolvePath } from "../utils/output";

import { PageContainer } from "../components/PageContainer";
import { PageHeader } from "../components/PageHeader";
import { RunPalm } from "../components/runPalm";
import { LiabilityConfig } from "../types/pages";
import { ValuationSettings } from "../components/valuation/valuationSettings";
import { ValuationOutput } from "../components/valuation/valuationOutput";
import { useLiabilityConfigStore, useUIConfigStore } from "../stores";

export type ConfigOption = {
  id: number;
  name: string;
  configJson: LiabilityConfig | undefined;
  path: string;
};

const Valuation: React.FC = () => {
  // TODO: add loading and error states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [palmFolderPath, setPalmFolderPath] = useState<string>("");
  const [configOptions, setConfigOptions] = useState<ConfigOption[]>([
    {
      id: 0,
      name: "Select Config Folder",
      configJson: undefined,
      path: "",
    },
  ]);

  const { config, configPath, setConfig, setConfigPath } = useLiabilityConfigStore();
  const { config: uiConfig } = useUIConfigStore();

  const PALM_FOLDER_PATH =
    process.env.NODE_ENV === "development"
      ? uiConfig.palmFolderPath || import.meta.env.VITE_DEV_PALM_FOLDER_PATH
      : uiConfig.palmFolderPath || import.meta.env.PROD_PALM_FOLDER_PATH;

  // on mount, get default palm folder and set default config
  useEffect(() => {
    const getLiabilityConfig = async () => {
      if (PALM_FOLDER_PATH) {
        try {
          setIsLoading(true);
          setError(null);

          // setting default palm folder
          const normalizedPalmFolderPath = normalizePathString(PALM_FOLDER_PATH);
          setPalmFolderPath(normalizedPalmFolderPath);

          // finding all available configs
          const configFolder = resolvePath(
            normalizedPalmFolderPath,
            uiConfig.pathToValuationConfigs || "../../../Configs/valuation"
          );
          const configFolderData = await invoke<Record<string, string>>(
            "find_liability_configs",
            {
              folderPath: configFolder,
            }
          );

          const cleanedConfigs = Object.fromEntries(
            Object.entries(configFolderData).map(([key, val]) => [
              key,
              JSON5.parse(cleanJsonString(val)) as LiabilityConfig,
            ])
          );
          const [firstEntry, configJson] = Object.entries(cleanedConfigs)[0];
          // set current config to first option by default
          if (firstEntry && configJson) {
            const configPath = resolvePath(configFolder, firstEntry);

            setConfigPath(configPath);
            setConfig(configJson);
          }

          // set all config options
          const configOptions = Object.entries(cleanedConfigs).map(([key, value], i) => ({
            id: i,
            name: key,
            configJson: value,
            path: resolvePath(configFolder, key),
          }));

          setConfigOptions(configOptions);
        } catch (err) {
          setError(err as string);
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    getLiabilityConfig();
  }, []);

  const exportPath = config?.sCashPath && resolvePath(palmFolderPath, config.sCashPath);

  return (
    <PageContainer>
      <div className="py-8 flex flex-col justify-center">
        <PageHeader title="Valuation" />

        <div className="flex w-full mt-8 gap-x-6">
          <div className="w-1/2 flex flex-col gap-y-8">
            {configOptions?.length > 0 && (
              <ValuationSettings
                configPath={configPath}
                palmFolderPath={palmFolderPath}
                configOptions={configOptions}
              />
            )}
          </div>

          <div className="w-1/2">
            {configOptions?.length > 0 && (
              <RunPalm
                palmFolderPath={palmFolderPath}
                palmConfigPath={configPath}
                moduleType="valuation"
              />
            )}
          </div>
        </div>

        <div className="mt-8">
          {exportPath && exportPath !== "/" && (
            <ValuationOutput exportFolderPath={exportPath} />
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default Valuation;
