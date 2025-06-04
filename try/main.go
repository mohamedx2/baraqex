package main

import (
	"fmt"
	"math"
	"strings"
	"syscall/js"
	"time"
)

// Global function registry to prevent garbage collection
var funcs = make(map[string]js.Func)

// Helper function to register a Go function in the global scope
func registerFunc(name string, fn func(this js.Value, args []js.Value) interface{}) {
	f := js.FuncOf(fn)
	funcs[name] = f
	js.Global().Set(name, f)
}

// goHello - Simple greeting function
func goHello(this js.Value, args []js.Value) interface{} {
	if len(args) < 1 {
		return "Hello, World!"
	}
	name := args[0].String()
	return fmt.Sprintf("Hello, %s! Greetings from Go WASM!", name)
}

// goAdd - Add two numbers
func goAdd(this js.Value, args []js.Value) interface{} {
	if len(args) < 2 {
		return 0
	}
	a := args[0].Float()
	b := args[1].Float()
	return a + b
}

// goMultiply - Multiply two numbers
func goMultiply(this js.Value, args []js.Value) interface{} {
	if len(args) < 2 {
		return 0
	}
	a := args[0].Float()
	b := args[1].Float()
	return a * b
}

// goFibonacci - Calculate Fibonacci number
func goFibonacci(this js.Value, args []js.Value) interface{} {
	if len(args) < 1 {
		return 0
	}
	n := int(args[0].Float())
	if n <= 1 {
		return n
	}

	a, b := 0, 1
	for i := 2; i <= n; i++ {
		a, b = b, a+b
	}
	return b
}

// goIsPrime - Check if a number is prime
func goIsPrime(this js.Value, args []js.Value) interface{} {
	if len(args) < 1 {
		return false
	}
	n := int(args[0].Float())
	if n <= 1 {
		return false
	}
	if n <= 3 {
		return true
	}
	if n%2 == 0 || n%3 == 0 {
		return false
	}

	for i := 5; i*i <= n; i += 6 {
		if n%i == 0 || n%(i+2) == 0 {
			return false
		}
	}
	return true
}

// goProcessArray - Process an array of numbers
func goProcessArray(this js.Value, args []js.Value) interface{} {
	if len(args) < 1 || args[0].Type() != js.TypeObject {
		return js.ValueOf([]interface{}{})
	}

	input := args[0]
	length := input.Get("length").Int()
	result := make([]interface{}, length)

	for i := 0; i < length; i++ {
		val := input.Index(i).Float()
		result[i] = val * 2 // Double each value
	}

	return js.ValueOf(result)
}

// goCalculatePI - Calculate PI using Leibniz formula
func goCalculatePI(this js.Value, args []js.Value) interface{} {
	iterations := 1000
	if len(args) > 0 {
		iterations = int(args[0].Float())
	}

	pi := 0.0
	for i := 0; i < iterations; i++ {
		term := 1.0 / float64(2*i+1)
		if i%2 == 0 {
			pi += term
		} else {
			pi -= term
		}
	}
	return pi * 4
}

// goPerformanceBenchmark - Simple performance test
func goPerformanceBenchmark(this js.Value, args []js.Value) interface{} {
	iterations := 10000
	if len(args) > 0 {
		iterations = int(args[0].Float())
	}

	start := time.Now()

	sum := 0.0
	for i := 0; i < iterations; i++ {
		sum += math.Sqrt(float64(i))
	}

	duration := time.Since(start)

	result := map[string]interface{}{
		"iterations": iterations,
		"sum":        sum,
		"duration":   duration.Milliseconds(),
		"unit":       "milliseconds",
	}

	return js.ValueOf(result)
}

// goStringUtils - String manipulation utilities
func goStringUtils(this js.Value, args []js.Value) interface{} {
	if len(args) < 1 {
		return js.ValueOf(map[string]interface{}{
			"error": "No string provided",
		})
	}

	text := args[0].String()
	words := strings.Fields(text)

	result := map[string]interface{}{
		"original":  text,
		"length":    len(text),
		"wordCount": len(words),
		"uppercase": strings.ToUpper(text),
		"lowercase": strings.ToLower(text),
		"reversed":  reverseString(text),
		"words":     words,
	}

	return js.ValueOf(result)
}

// Helper function to reverse a string
func reverseString(s string) string {
	runes := []rune(s)
	for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
		runes[i], runes[j] = runes[j], runes[i]
	}
	return string(runes)
}

// goDemo - Comprehensive demo function
func goDemo(this js.Value, args []js.Value) interface{} {
	// Create a simple map that doesn't trigger js.ValueOf issues
	demo := map[string]interface{}{
		"message":     "Go WASM is working!",
		"timestamp":   time.Now().Unix(),
		"fibonacci10": 55,
		"pi":          3.141592653589793,
		"prime17":     true,
	}

	// Return the map directly without wrapping
	return demo
}

func main() {
	fmt.Println("Go WASM module starting...")

	// Register all functions
	registerFunc("goHello", goHello)
	registerFunc("goAdd", goAdd)
	registerFunc("goMultiply", goMultiply)
	registerFunc("goFibonacci", goFibonacci)
	registerFunc("goIsPrime", goIsPrime)
	registerFunc("goProcessArray", goProcessArray)
	registerFunc("goCalculatePI", goCalculatePI)
	registerFunc("goPerformanceBenchmark", goPerformanceBenchmark)
	registerFunc("goStringUtils", goStringUtils)
	registerFunc("goDemo", goDemo)

	fmt.Println("Go functions registered successfully!")
	fmt.Printf("Registered %d functions\n", len(funcs))

	// Test that functions are accessible
	console := js.Global().Get("console")
	if !console.IsUndefined() {
		console.Call("log", "Go WASM: All functions registered and ready!")
	}

	// Don't use select{} in testing environment - just finish the main function
	// The functions are now registered and will remain available
	fmt.Println("Go WASM initialization complete")
}
