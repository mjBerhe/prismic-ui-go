import { useState, useEffect, Fragment } from "react";
import { ExecutePythonScript, GetFilenames, ReadFiles } from "../../wailsjs/go/main/App";
import { useUIConfigStore } from "../stores";

import { cn } from "../utils/utils";
import { getRelativePath, normalizePathString } from "../utils/output";
import { ChevronDown, X } from "lucide-react";
import {
  Listbox,
  ListboxOption,
  ListboxOptions,
  ListboxButton,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
} from "@headlessui/react";
import { LoadingIcon } from "../components/svgs/LoadingIcon";
import { Check } from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/Button";
import { Scenarios } from "../components/generate-inputs/scenarios";

const GenerateInputs: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const [inputFileOptions, setInputFileOptions] = useState<
    { id: number; name: string }[]
  >([]);
  const [selectedInputFile, setSelectedInputFile] = useState({
    id: 0,
    name: "Select Input File",
  });

  const { config } = useUIConfigStore();
  const { pythonLiabilityConfigScript, pythonSpreadAssumptionScript, uiDirectory } =
    config;

  const runPythonScript = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsCompleted(false);

      const inputTemplatePath = `${uiDirectory}/${selectedInputFile.name}`;
      const updateLiabilityConfigsScriptPath = normalizePathString(
        pythonLiabilityConfigScript
      );
      const updateSpreadAssumptionPath = normalizePathString(
        pythonSpreadAssumptionScript
      );

      // creating new liability_config files based on excel template
      await ExecutePythonScript(updateLiabilityConfigsScriptPath, [inputTemplatePath]);

      // creating new spread assumption file in input folder based on excel template
      await ExecutePythonScript(updateSpreadAssumptionPath, [inputTemplatePath]);

      setIsCompleted(true);
    } catch (err) {
      console.error(err);
      setError(err as string);
    } finally {
      setIsLoading(false);
    }
  };

  // load input files to use for generating inputs
  useEffect(() => {
    const loadInputFiles = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const files = (await GetFilenames(uiDirectory)).filter((file) =>
          file.endsWith(".xlsx")
        );

        if (files) {
          setInputFileOptions(files.map((x, i) => ({ id: i, name: x })));
        } else {
          setInputFileOptions([]);
        }
      } catch (err) {
        setError(err as string);
        console.error(err as string);
      } finally {
        setIsLoading(false);
      }
    };
    loadInputFiles();
  }, []);

  const tabs = [
    { name: "Spread & Config", id: 0 },
    { name: "Scenarios", id: 1 },
  ];

  return (
    <PageContainer>
      <div className="py-8 flex flex-col justify-center">
        <PageHeader title="Generate Inputs" />

        <div className="flex flex-col w-full items-center">
          <TabGroup className="mt-6 flex flex-col items-center">
            <TabList className="flex justify-center border rounded-lg border-dark-500 shadow-lg divide-x divide-dark-500 overflow-hidden">
              {tabs.map((tab) => (
                <Tab key={tab.id}>
                  {({ selected }) => (
                    <p
                      className={cn(
                        "w-[200px] py-2",
                        selected
                          ? "border-b border-b-primary-400 bg-dark-700/70"
                          : "bg-transparent"
                      )}
                    >
                      {tab.name}
                    </p>
                  )}
                </Tab>
              ))}
            </TabList>
            <TabPanels className="mt-8">
              <TabPanel>
                <div className="flex flex-col mx-auto w-[400px] items-center">
                  <Listbox value={selectedInputFile} onChange={setSelectedInputFile}>
                    <ListboxButton
                      className={cn(
                        "relative block w-full rounded-lg bg-dark-800 py-1.5 pr-8 pl-3 text-left text-sm/6 text-white border border-dark-600",
                        "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25"
                      )}
                    >
                      {selectedInputFile.name}
                      <ChevronDown className="pointer-events-none absolute top-2.5 right-2.5 size-4 fill-white/60" />
                    </ListboxButton>
                    <ListboxOptions
                      anchor="bottom"
                      className={cn(
                        "relative w-[var(--button-width)] z-100 my-1 rounded-xl bg-dark-800 border border-dark-600 p-1 focus:outline-none",
                        "transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0"
                      )}
                    >
                      {inputFileOptions.map((option) => (
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
                  <div className="flex w-full justify-center mt-4 items-center gap-x-2">
                    <Button
                      onClick={runPythonScript}
                      disabled={
                        isLoading ||
                        !selectedInputFile ||
                        selectedInputFile.name === "Select Input File"
                      }
                    >
                      Generate Inputs
                    </Button>
                    {isLoading ? (
                      <LoadingIcon />
                    ) : error ? (
                      <X color="red" size={30} />
                    ) : isCompleted ? (
                      <Check color="green" size={30} />
                    ) : (
                      <></>
                    )}
                  </div>
                </div>
              </TabPanel>
              <TabPanel>
                <Scenarios />
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </div>
      </div>
    </PageContainer>
  );
};

export default GenerateInputs;
