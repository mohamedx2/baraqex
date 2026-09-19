package main

import (
	"syscall/js"
)

// goAdd returns the sum of two numbers.
func goAdd(this js.Value, args []js.Value) interface{} {
	a := args[0].Float()
	b := args[1].Float()
	return a + b
}

// goMultiply returns the product of two numbers.
func goMultiply(this js.Value, args []js.Value) interface{} {
	a := args[0].Float()
	b := args[1].Float()
	return a * b
}

// goFibonacci returns the nth Fibonacci number (0-indexed).
func goFibonacci(this js.Value, args []js.Value) interface{} {
	n := args[0].Int()
	if n <= 1 {
		return n
	}
	a, b := 0, 1
	for i := 2; i <= n; i++ {
		a, b = b, a+b
	}
	return b
}

// goProcessArray doubles each element of a JS array.
func goProcessArray(this js.Value, args []js.Value) interface{} {
	src := args[0]
	length := src.Length()
	result := make([]interface{}, length)
	for i := 0; i < length; i++ {
		val := src.Index(i).Float()
		result[i] = val * 2
	}
	return result
}

func main() {
	c := make(chan struct{}, 0)
	js.Global().Set("goAdd", js.FuncOf(goAdd))
	js.Global().Set("goMultiply", js.FuncOf(goMultiply))
	js.Global().Set("goFibonacci", js.FuncOf(goFibonacci))
	js.Global().Set("goProcessArray", js.FuncOf(goProcessArray))
	<-c
}
