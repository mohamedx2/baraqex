//go:build js && wasm
// +build js,wasm

package main

import (
	"encoding/json"
	"fmt"
	"syscall/js"
)

// Example Go function to be called from JavaScript
func add(this js.Value, args []js.Value) interface{} {
	if len(args) != 2 {
		return js.ValueOf("Error: Expected two arguments")
	}
	
	a := args[0].Int()
	b := args[1].Int()
	return js.ValueOf(a + b)
}

// Process complex data in Go
func processData(this js.Value, args []js.Value) interface{} {
	if len(args) == 0 {
		return js.ValueOf("Error: Expected at least one argument")
	}

	// Get input data
	data := args[0]
	if data.Type() != js.TypeObject {
		return js.ValueOf("Error: Expected JSON object")
	}

	// Convert JS object to Go map
	jsonStr := js.Global().Get("JSON").Call("stringify", data).String()
	var inputMap map[string]interface{}
	if err := json.Unmarshal([]byte(jsonStr), &inputMap); err != nil {
		return js.ValueOf(fmt.Sprintf("Error parsing JSON: %s", err.Error()))
	}

	// Add new fields
	inputMap["processed"] = true
	inputMap["processor"] = "Go WASM"

	// Add some computed fields
	if values, ok := inputMap["values"].([]interface{}); ok {
		sum := 0.0
		for _, v := range values {
			if num, ok := v.(float64); ok {
				sum += num
			}
		}
		inputMap["sum"] = sum
	}

	// Convert back to JS
	resultJSON, err := json.Marshal(inputMap)
	if err != nil {
		return js.ValueOf(fmt.Sprintf("Error generating JSON: %s", err.Error()))
	}

	return js.ValueOf(string(resultJSON))
}

func main() {
	fmt.Println("Go WASM Module initialized")
	
	// Register functions to be callable from JavaScript
	js.Global().Set("goAdd", js.FuncOf(add))
	js.Global().Set("goProcessData", js.FuncOf(processData))
	
	// Keep the program running
	<-make(chan bool)
}
