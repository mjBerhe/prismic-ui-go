package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/yosuke-furukawa/json5/encoding/json5"
)

type Config struct {
	PalmFolderPath               string `json:"palmFolderPath"`
	PalmInputDataPath            string `json:"palmInputDataPath"`
	PalmOutputDataPath           string `json:"palmOutputDataPath"`
	PathToValuationConfigs       string `json:"pathToValuationConfigs"`
	PathToLiabilityConfigs       string `json:"pathToLiabilityConfigs"`
	PathToRiskConfigs            string `json:"pathToRiskConfigs"`
	GenerateInputFilePath        string `json:"generateInputFilePath"`
	GenerateInputFolderPath      string `json:"generateInputFolderPath"`
	GenerateLiabilityConfigPath  string `json:"generateLiabilityConfigPath"`
	GenerateSpreadAssumptionPath string `json:"generateSpreadAssumptionPath"`
	GenerateScenarioConfigPath   string `json:"generateScenarioConfigPath"`
	GenerateScenarioPath         string `json:"generateScenarioPath"`
	ScenarioConfigsPath          string `json:"scenarioConfigsPath"`
	ParseOutputPath              string `json:"parseOutputPath"`
	BaseLiabilityConfigPath      string `json:"baseLiabilityConfigPath"`
	BaseSpreadAssumptionPath     string `json:"baseSpreadAssumptionPath"`
}

type LiabilityConfig struct {
	IProjectNum          int                  `json:"iProjectNum"`
	SFileName            string               `json:"sFileName"`
	SFolderName          string               `json:"sFolderName"`
	MultiProjectSettings MultiProjectSettings `json:"MultiProjectSettings"`
	SCashPath            string               `json:"sCashPath"`
	AssetPath            string               `json:"asset_path"`
	SOutterLoopScenario  string               `json:"sOutterLoopScenario"`
	SInnerLoopScenario   string               `json:"sInnerLoopScenario"`
	SLiabilityPath       string               `json:"sLiabilityPath"`
	SPlanSpecPath        string               `json:"sPlanSpecPath"`
	SoFrOuter            string               `json:"sofr_outer"`
	SoFrInner            string               `json:"sofr_inner"`
	SoFrInnerU25         string               `json:"sofr_inner_u25"`
	SoFrInnerD25         string               `json:"sofr_inner_d25"`
	SoFrInnerLiqup       string               `json:"sofr_inner_liqup"`
	SoFrInnerLiqdown     string               `json:"sofr_inner_liqdown"`
	SoFrInnerLiqupU25    string               `json:"sofr_inner_liqup_u25"`
	SoFrInnerLiqupD25    string               `json:"sofr_inner_liqup_d25"`
	SoFrInnerLiqdownU25  string               `json:"sofr_inner_liqdown_u25"`
	SoFrInnerLiqdownD25  string               `json:"sofr_inner_liqdown_d25"`
	SVM20JsonPath        string               `json:"sVM20_JsonPath"`
}

type MultiProjectSettings struct {
	PortfolioPath  string `json:"PortfolioPath"`
	SLiabilityPath string `json:"sLiabilityPath"`
}

type LiabilityConfigData struct {
	DirectoryName string
	ConfigData    LiabilityConfig
}

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

func (a *App) ReadUIConfig() (*Config, error) {
	configFilename := "ui_config.json"

	dir, err := os.Getwd()
	if err != nil {
		fmt.Println("Error:", err)
		return nil, fmt.Errorf("error getting working directory")
	}
	// fmt.Println("Current directory:", dir)

	configPath := filepath.Join(dir, configFilename)

	file, err := os.Open(configPath) // For read access.
	if err != nil {
		fmt.Println("Error:", err)
	}
	defer file.Close() // Ensure the file is closed after reading

	// Create an instance of Config to unmarshal the file data into
	var config Config

	// Use json.NewDecoder().Decode() to read and unmarshal the JSON content directly
	decoder := json.NewDecoder(file)
	err = decoder.Decode(&config)
	if err != nil {
		return nil, fmt.Errorf("error decoding JSON: %v", err)
	}

	// Return the config
	return &config, nil
}

func (a *App) GetLiabilityConfigs(folderPath string) ([]LiabilityConfigData, error) {
	var configs []LiabilityConfigData
	// walk through directory
	err := filepath.WalkDir(folderPath, func(path string, dir os.DirEntry, err error) error {
		if err != nil {
			fmt.Println("Error walking through config folder:", err)
			return err
		}

		// check if the current item is a directory
		if dir.IsDir() && path != folderPath {
			liabilityConfigPath := filepath.Join(path, "liability_config.json")

			// check if the liability_config.json file exists
			if _, err := os.Stat(liabilityConfigPath); err == nil {
				// File exists, now open and read it
				file, err := os.Open(liabilityConfigPath)
				if err != nil {
					fmt.Println("Error opening config file:", err)
					return err
				}
				defer file.Close()

				var config LiabilityConfig

				decoder := json5.NewDecoder(file)
				decodeErr := decoder.Decode(&config)
				if decodeErr != nil {
					fmt.Println("Error decoding json file:", decodeErr)
				}

				_, marhsallErr := json.MarshalIndent(config, "", "    ")
				if marhsallErr != nil {
					fmt.Println("Error: marshalling file:", marhsallErr)
				}

				// Store the config along with the subdirectory name
				configs = append(configs, struct {
					DirectoryName string
					ConfigData    LiabilityConfig
				}{
					DirectoryName: path,
					ConfigData:    config,
				})
			}
		}
		return nil
	})

	if err != nil {
		return nil, err
	}

	return configs, nil
}
