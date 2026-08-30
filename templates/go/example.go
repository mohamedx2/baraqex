//go:build js && wasm
// +build js,wasm

package main

import (
	"fmt"
	"strconv"
	"strings"
	"syscall/js"
)

// Main function required for Go WebAssembly
func main() {
	// Set up global functions that will be accessible from JavaScript
	js.Global().Set("goAdd", js.FuncOf(goAdd))
	js.Global().Set("goSubtract", js.FuncOf(goSubtract))
	js.Global().Set("goMultiply", js.FuncOf(goMultiply))
	js.Global().Set("goDivide", js.FuncOf(goDivide))
	js.Global().Set("goReverseString", js.FuncOf(goReverseString))
	js.Global().Set("goCalculateFactorial", js.FuncOf(goCalculateFactorial))
	js.Global().Set("goProcessArray", js.FuncOf(goProcessArray))

	// Keep the Go program running until the context is done
	// This is necessary for WebAssembly modules
	<-make(chan bool)
}

// goAdd adds two numbers and returns the result
func goAdd(this js.Value, args []js.Value) interface{} {
	if len(args) != 2 {
		return map[string]interface{}{
			"error": "Expected 2 arguments: number, number",
		}
	}

	// Parse string arguments as numbers
	a, errA := strconv.ParseFloat(args[0].String(), 64)
	b, errB := strconv.ParseFloat(args[1].String(), 64)

	// Check for parsing errors
	if errA != nil || errB != nil {
		return map[string]interface{}{
			"error": "Arguments must be valid numbers",
		}
	}

	// Return the result
	return fmt.Sprintf("%g", a+b)
}

// goSubtract subtracts the second number from the first
func goSubtract(this js.Value, args []js.Value) interface{} {
	if len(args) != 2 {
		return map[string]interface{}{
			"error": "Expected 2 arguments: number, number",
		}
	}

	// Parse string arguments as numbers
	a, errA := strconv.ParseFloat(args[0].String(), 64)
	b, errB := strconv.ParseFloat(args[1].String(), 64)

	// Check for parsing errors
	if errA != nil || errB != nil {
		return map[string]interface{}{
			"error": "Arguments must be valid numbers",
		}
	}

	// Return the result
	return fmt.Sprintf("%g", a-b)
}

// goMultiply multiplies two numbers
func goMultiply(this js.Value, args []js.Value) interface{} {
	if len(args) != 2 {
		return map[string]interface{}{
			"error": "Expected 2 arguments: number, number",
		}
	}

	// Parse string arguments as numbers
	a, errA := strconv.ParseFloat(args[0].String(), 64)
	b, errB := strconv.ParseFloat(args[1].String(), 64)

	// Check for parsing errors
	if errA != nil || errB != nil {
		return map[string]interface{}{
			"error": "Arguments must be valid numbers",
		}
	}

	// Return the result
	return fmt.Sprintf("%g", a*b)
}

// goDivide divides the first number by the second
func goDivide(this js.Value, args []js.Value) interface{} {
	if len(args) != 2 {
		return map[string]interface{}{
			"error": "Expected 2 arguments: number, number",
		}
	}

	// Parse string arguments as numbers
	a, errA := strconv.ParseFloat(args[0].String(), 64)
	b, errB := strconv.ParseFloat(args[1].String(), 64)

	// Check for parsing errors
	if errA != nil || errB != nil {
		return map[string]interface{}{
			"error": "Arguments must be valid numbers",
		}
	}

	// Check for division by zero
	if b == 0 {
		return map[string]interface{}{
			"error": "Division by zero is not allowed",
		}
	}

	// Return the result
	return fmt.Sprintf("%g", a/b)
}

// goReverseString reverses a string
func goReverseString(this js.Value, args []js.Value) interface{} {
	if len(args) != 1 {
		return map[string]interface{}{
			"error": "Expected 1 argument: string",
		}
	}

	input := args[0].String()
	runes := []rune(input)

	// Reverse the string
	for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
		runes[i], runes[j] = runes[j], runes[i]
	}

	return string(runes)
}

// goCalculateFactorial calculates the factorial of a number
func goCalculateFactorial(this js.Value, args []js.Value) interface{} {
	if len(args) != 1 {
		return map[string]interface{}{
			"error": "Expected 1 argument: number",
		}
	}

	// Parse string argument as number
	n, err := strconv.ParseInt(args[0].String(), 10, 64)

	// Check for parsing errors
	if err != nil {
		return map[string]interface{}{
			"error": "Argument must be a valid integer",
		}
	}

	// Check for negative numbers
	if n < 0 {
		return map[string]interface{}{
			"error": "Factorial is not defined for negative numbers",
		}
	}

	// Calculate factorial
	result := int64(1)
	for i := int64(2); i <= n; i++ {
		result *= i
	}

	return fmt.Sprintf("%d", result)
}

// goProcessArray processes an array of values
func goProcessArray(this js.Value, args []js.Value) interface{} {
	if len(args) != 1 || args[0].Type() != js.TypeString {
		return map[string]interface{}{
			"error": "Expected 1 argument: comma-separated string",
		}
	}

	// Split the input string by commas
	input := args[0].String()
	parts := strings.Split(input, ",")

	// Process each part
	var results []string
	for _, part := range parts {
		// Trim whitespace
		trimmed := strings.TrimSpace(part)

		// Convert to uppercase and add to results
		results = append(results, strings.ToUpper(trimmed))
	}

	// Join the processed parts with commas
	return strings.Join(results, ",")
}
