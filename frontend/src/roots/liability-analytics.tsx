import { useState, useEffect } from "react";
import { GetLiabilityConfigs } from "../../wailsjs/go/main/App";
import {
  cleanJsonString,
  normalizePathString,
  resolvePath,
  extractFileName,
} from "../utils/output";

import { PageContainer } from "../components/PageContainer";
import { PageHeader } from "../components/PageHeader";
import { RunPalm } from "../components/runPalm";
import { useLiabilityConfigStore, useUIConfigStore } from "../stores";
import type { ConfigOption } from "./valuation";
import { LiabilityAnalyticsSettings } from "../components/liability-analytics/liabilityAnalyticsSettings";
import { LiabilityAnalyticsOutput } from "../components/liability-analytics/liabilityAnalyticsOutput";

const LiabilityAnalyics: React.FC = () => {
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
            uiConfig.pathToLiabilityConfigs || "../../../Configs/liability_analytics"
          );

          const configFolderData = await GetLiabilityConfigs(configFolder);

          const configOptions = configFolderData.map((item, i) => ({
            id: i,
            name: extractFileName(item.DirectoryName),
            configJson: item.ConfigData,
            path: item.DirectoryName,
          }));
          setConfigOptions(configOptions);

          if (configOptions[0]) {
            setConfigPath(configOptions[0].path);
            setConfig(configOptions[0].configJson);
          }
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
        <PageHeader title="Liability Analytics" />

        <div className="flex w-full mt-8 gap-x-6">
          <div className="w-1/2 flex flex-col gap-y-8">
            {configOptions?.length > 0 && (
              <LiabilityAnalyticsSettings
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
                moduleType="liability_analytics"
              />
            )}
          </div>
        </div>

        <div className="mt-8">
          {exportPath && exportPath !== "/" && (
            <LiabilityAnalyticsOutput exportFolderPath={exportPath} />
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default LiabilityAnalyics;
