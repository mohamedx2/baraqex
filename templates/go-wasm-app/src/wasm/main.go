package main

import (
	"fmt"
	"math"
	"syscall/js"
	"time"
)

// Global function registry
var funcs = make(map[string]js.Func)

// Register a Go function in the global scope
func registerFunc(name string, fn func(this js.Value, args []js.Value) interface{}) {
	f := js.FuncOf(fn)
	funcs[name] = f
	js.Global().Set(name, f)
}

// Calculate factorial using Go
func goFactorial(this js.Value, args []js.Value) interface{} {
	if len(args) < 1 {
		return 1
	}
	n := int(args[0].Float())
	if n <= 1 {
		return 1
	}

	result := 1
	for i := 2; i <= n; i++ {
		result *= i
	}
	return result
}

// High-performance matrix multiplication
func goMatrixMultiply(this js.Value, args []js.Value) interface{} {
	if len(args) < 2 {
		return js.ValueOf([]interface{}{})
	}

	// Simple 2x2 matrix multiplication example
	matrixA := [][]float64{{1, 2}, {3, 4}}
	matrixB := [][]float64{{5, 6}, {7, 8}}

	result := make([][]float64, 2)
	for i := range result {
		result[i] = make([]float64, 2)
	}

	for i := 0; i < 2; i++ {
		for j := 0; j < 2; j++ {
			for k := 0; k < 2; k++ {
				result[i][j] += matrixA[i][k] * matrixB[k][j]
			}
		}
	}

	return js.ValueOf(map[string]interface{}{
		"result":      result,
		"computation": "2x2 matrix multiplication completed",
	})
}

// Complex mathematical computation
func goComplexComputation(this js.Value, args []js.Value) interface{} {
	iterations := 10000
	if len(args) > 0 {
		iterations = int(args[0].Float())
	}

	start := time.Now()

	// Monte Carlo estimation of Pi
	inside := 0
	for i := 0; i < iterations; i++ {
		x := float64(i%1000) / 1000.0
		y := float64((i*7)%1000) / 1000.0
		if x*x+y*y <= 1.0 {
			inside++
		}
	}

	pi := 4.0 * float64(inside) / float64(iterations)
	duration := time.Since(start)

	return js.ValueOf(map[string]interface{}{
		"pi":         pi,
		"iterations": iterations,
		"duration":   duration.Milliseconds(),
		"accuracy":   math.Abs(math.Pi - pi),
	})
}

// Image processing simulation
func goImageFilter(this js.Value, args []js.Value) interface{} {
	if len(args) < 1 {
		return js.ValueOf(map[string]interface{}{
			"error": "Image data required",
		})
	}

	// Simulate image processing
	width, height := 100, 100
	processed := make([][]int, height)

	for i := range processed {
		processed[i] = make([]int, width)
		for j := range processed[i] {
			// Simple blur filter simulation
			processed[i][j] = (i + j) % 256
		}
	}

	return js.ValueOf(map[string]interface{}{
		"width":     width,
		"height":    height,
		"processed": true,
		"filter":    "blur",
		"pixels":    width * height,
	})
}

// Cryptographic hash function
func goCryptoHash(this js.Value, args []js.Value) interface{} {
	if len(args) < 1 {
		return ""
	}

	input := args[0].String()

	// Simple hash implementation (not cryptographically secure)
	hash := uint32(0)
	for _, char := range input {
		hash = hash*31 + uint32(char)
	}

	return js.ValueOf(map[string]interface{}{
		"input":  input,
		"hash":   fmt.Sprintf("%x", hash),
		"length": len(input),
	})
}

func main() {
	fmt.Println("Go WASM module for Baraqex starting...")

	// Register all Go functions
	registerFunc("goFactorial", goFactorial)
	registerFunc("goMatrixMultiply", goMatrixMultiply)
	registerFunc("goComplexComputation", goComplexComputation)
	registerFunc("goImageFilter", goImageFilter)
	registerFunc("goCryptoHash", goCryptoHash)

	fmt.Printf("Registered %d Go functions for Baraqex\n", len(funcs))

	// Notify JavaScript that Go WASM is ready
	if console := js.Global().Get("console"); !console.IsUndefined() {
		console.Call("log", "🔄 Go WASM functions ready for Baraqex!")
	}

	fmt.Println("Go WASM initialization complete")
}
