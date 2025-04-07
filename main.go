package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Test the ExecutePythonScript function
	// output, pyErr := app.ExecutePythonScript("C:/Users/mattberhe/pALM/prismic_ws_dll/UserInputUI/resultParser.py", "valuation", "../data_pru_03312024_output/valuation/", "Sen_0000")
	// if pyErr != nil {
	// 	fmt.Println("Error running Python script:", pyErr)
	// } else {
	// 	fmt.Println("Python script output:", output)
	// }

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "prismic-ui",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
