import { useState, useEffect } from "react";
import { GetLiabilityConfigs } from "../../wailsjs/go/main/App";
import { extractFileName, normalizePathString, resolvePath } from "../utils/output";

import { PageContainer } from "../components/PageContainer";
import { PageHeader } from "../components/PageHeader";
import { RunPalm } from "../components/runPalm";
import { useLiabilityConfigStore, useUIConfigStore } from "../stores";
import { main } from "../../wailsjs/go/models";
import { SAASettings } from "../components/strategic-asset-allocation/saaSettings";
import { SAAOutput } from "../components/strategic-asset-allocation/saaOutput";

export type ConfigOption = {
  id: number;
  name: string;
  configJson: main.LiabilityConfig | undefined;
  path: string;
};

const StrategicAssetAllocation: React.FC = () => {
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

  const PALM_FOLDER_PATH = uiConfig.palmSAAFolderPath;
  const CONFIGS_PATH = uiConfig.pathToSAAConfigs;

  if (!PALM_FOLDER_PATH || !CONFIGS_PATH) {
    !error && setError("pALM folder or config folders were not found");
  }

  // on mount, get default palm folder and set default config
  useEffect(() => {
    const getLiabilityConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // setting default palm folder
        const normalizedPalmFolderPath = normalizePathString(PALM_FOLDER_PATH);
        setPalmFolderPath(normalizedPalmFolderPath);

        // finding all available configs
        const configFolder = resolvePath(normalizedPalmFolderPath, CONFIGS_PATH);

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
    };

    getLiabilityConfig();
  }, []);

  const exportPath = config?.sCashPath && resolvePath(palmFolderPath, config.sCashPath);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <PageContainer>
      <div className="py-8 flex flex-col justify-center">
        <PageHeader title="Strategic Asset Allocation" />

        <div className="flex w-full mt-8 gap-x-6">
          <div className="w-1/2 flex flex-col gap-y-8">
            {configOptions?.length > 0 && (
              <SAASettings
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
                moduleType="saa"
              />
            )}
          </div>
        </div>

        <div className="mt-8">
          {exportPath && exportPath !== "/" && (
            <SAAOutput exportFolderPath={exportPath} />
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default StrategicAssetAllocation;
