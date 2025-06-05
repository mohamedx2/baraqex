package main

import (
	"fmt"
	"strings"
	"syscall/js"
)

// Global variable to hold JS values for complex data exchange
var jsGlobal = js.Global()

// Hello function - greeting with name
func goHello(this js.Value, args []js.Value) interface{} {
	if len(args) != 1 {
		return js.ValueOf("Error: goHello requires exactly 1 argument")
	}

	name := args[0].String()
	result := fmt.Sprintf("Hello, %s from Go WASM!", name)

	fmt.Printf("Go WASM: goHello('%s') = '%s'\n", name, result)
	return js.ValueOf(result)
}

// Add function - simple arithmetic
func goAdd(this js.Value, args []js.Value) interface{} {
	if len(args) != 2 {
		return js.ValueOf("Error: goAdd requires exactly 2 arguments")
	}

	a := args[0].Float()
	b := args[1].Float()
	result := a + b

	fmt.Printf("Go WASM: goAdd(%f, %f) = %f\n", a, b, result)
	return js.ValueOf(result)
}

// Multiply function - simple arithmetic
func goMultiply(this js.Value, args []js.Value) interface{} {
	if len(args) != 2 {
		return js.ValueOf("Error: goMultiply requires exactly 2 arguments")
	}

	a := args[0].Float()
	b := args[1].Float()
	result := a * b

	fmt.Printf("Go WASM: goMultiply(%f, %f) = %f\n", a, b, result)
	return js.ValueOf(result)
}

// Fibonacci function - recursive computation
func goFibonacci(this js.Value, args []js.Value) interface{} {
	if len(args) != 1 {
		return js.ValueOf("Error: goFibonacci requires exactly 1 argument")
	}

	n := int(args[0].Float())
	if n < 0 {
		return js.ValueOf("Error: goFibonacci requires non-negative number")
	}

	result := fibonacciCalc(n)
	fmt.Printf("Go WASM: goFibonacci(%d) = %d\n", n, result)
	return js.ValueOf(result)
}

// Prime check function
func goIsPrime(this js.Value, args []js.Value) interface{} {
	if len(args) != 1 {
		return js.ValueOf("Error: goIsPrime requires exactly 1 argument")
	}

	n := int(args[0].Float())
	if n < 2 {
		return js.ValueOf(false)
	}
	if n == 2 {
		return js.ValueOf(true)
	}
	if n%2 == 0 {
		return js.ValueOf(false)
	}

	for i := 3; i*i <= n; i += 2 {
		if n%i == 0 {
			return js.ValueOf(false)
		}
	}

	fmt.Printf("Go WASM: goIsPrime(%d) = %t\n", n, true)
	return js.ValueOf(true)
}

// Helper function for fibonacci calculation
func fibonacciCalc(n int) int {
	if n <= 1 {
		return n
	}

	a, b := 0, 1
	for i := 2; i <= n; i++ {
		a, b = b, a+b
	}
	return b
}

// Process array function - demonstrates array handling
func goProcessArray(this js.Value, args []js.Value) interface{} {
	if len(args) != 1 {
		return js.ValueOf("Error: goProcessArray requires exactly 1 argument")
	}

	jsArray := args[0]
	if jsArray.Type() != js.TypeObject {
		return js.ValueOf("Error: argument must be an array")
	}

	length := jsArray.Get("length").Int()
	goSlice := make([]int, length)

	// Convert JS array to Go slice
	for i := 0; i < length; i++ {
		goSlice[i] = int(jsArray.Index(i).Float())
	}

	// Process the slice (double each element and add index)
	processedSlice := make([]interface{}, length)
	for i, val := range goSlice {
		processedSlice[i] = (val * 2) + i
	}

	fmt.Printf("Go WASM: goProcessArray([%s]) = [", strings.Trim(fmt.Sprint(goSlice), "[]"))
	for i, val := range processedSlice {
		if i > 0 {
			fmt.Printf(" ")
		}
		fmt.Printf("%v", val)
	}
	fmt.Printf("]\n")

	// Convert back to JS array
	result := jsGlobal.Get("Array").New(length)
	for i, val := range processedSlice {
		result.SetIndex(i, val)
	}

	return result
}

// Calculate PI using series approximation
func goCalculatePI(this js.Value, args []js.Value) interface{} {
	if len(args) != 1 {
		return js.ValueOf("Error: goCalculatePI requires exactly 1 argument")
	}

	iterations := int(args[0].Float())
	pi := 0.0

	for i := 0; i < iterations; i++ {
		term := 1.0 / float64(2*i+1)
		if i%2 == 1 {
			term = -term
		}
		pi += term
	}

	result := pi * 4
	fmt.Printf("Go WASM: goCalculatePI(%d iterations) = %f\n", iterations, result)
	return js.ValueOf(result)
}

// Performance benchmark function
func goPerformanceBenchmark(this js.Value, args []js.Value) interface{} {
	if len(args) != 1 {
		return js.ValueOf("Error: goPerformanceBenchmark requires exactly 1 argument")
	}

	iterations := int(args[0].Float())

	// Simple computational benchmark
	sum := 0
	for i := 0; i < iterations; i++ {
		sum += i * i
	}

	// Convert Go map to JS object
	jsResult := jsGlobal.Get("Object").New()
	jsResult.Set("iterations", js.ValueOf(iterations))
	jsResult.Set("result", js.ValueOf(sum))
	jsResult.Set("message", js.ValueOf(fmt.Sprintf("Completed %d iterations in Go WASM", iterations)))

	fmt.Printf("Go WASM: goPerformanceBenchmark(%d) = %d\n", iterations, sum)
	return jsResult
}

// String utilities function
func goStringUtils(this js.Value, args []js.Value) interface{} {
	if len(args) != 1 {
		return js.ValueOf("Error: goStringUtils requires exactly 1 argument")
	}

	input := args[0].String()

	// Create result object with various string operations
	result := jsGlobal.Get("Object").New()
	result.Set("original", js.ValueOf(input))
	result.Set("uppercase", js.ValueOf(strings.ToUpper(input)))
	result.Set("lowercase", js.ValueOf(strings.ToLower(input)))
	result.Set("reversed", js.ValueOf(reverseString(input)))
	result.Set("length", js.ValueOf(len(input)))
	result.Set("wordCount", js.ValueOf(len(strings.Fields(input))))

	fmt.Printf("Go WASM: goStringUtils('%s') completed\n", input)
	return result
}

// Helper function to reverse a string
func reverseString(s string) string {
	runes := []rune(s)
	for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
		runes[i], runes[j] = runes[j], runes[i]
	}
	return string(runes)
}

// Initialize and register functions
func main() {
	fmt.Println("🚀 Go WASM module initializing...")

	// Register all functions to the global JS scope with "go" prefix
	jsGlobal.Set("goHello", js.FuncOf(goHello))
	jsGlobal.Set("goAdd", js.FuncOf(goAdd))
	jsGlobal.Set("goMultiply", js.FuncOf(goMultiply))
	jsGlobal.Set("goFibonacci", js.FuncOf(goFibonacci))
	jsGlobal.Set("goIsPrime", js.FuncOf(goIsPrime))
	jsGlobal.Set("goProcessArray", js.FuncOf(goProcessArray))
	jsGlobal.Set("goCalculatePI", js.FuncOf(goCalculatePI))
	jsGlobal.Set("goPerformanceBenchmark", js.FuncOf(goPerformanceBenchmark))
	jsGlobal.Set("goStringUtils", js.FuncOf(goStringUtils))

	fmt.Println("✅ Go WASM functions registered:")
	fmt.Println("   • goHello(name) - Greeting function")
	fmt.Println("   • goAdd(a, b) - Addition")
	fmt.Println("   • goMultiply(a, b) - Multiplication")
	fmt.Println("   • goFibonacci(n) - Fibonacci sequence")
	fmt.Println("   • goIsPrime(n) - Prime number check")
	fmt.Println("   • goProcessArray(arr) - Array processing")
	fmt.Println("   • goCalculatePI(iterations) - PI calculation")
	fmt.Println("   • goPerformanceBenchmark(n) - Performance testing")
	fmt.Println("   • goStringUtils(str) - String utilities")

	// Keep the program running
	select {}
}
