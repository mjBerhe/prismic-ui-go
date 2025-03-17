package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
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
