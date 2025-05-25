// Enhanced calculator component for test interface
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Delete, Calculator as CalculatorIcon } from "lucide-react";

export function Calculator({ isOpen, onClose }) {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [waitingForNext, setWaitingForNext] = useState(false);

  const inputNumber = (num) => {
    if (waitingForNext) {
      setDisplay(String(num));
      setWaitingForNext(false);
    } else {
      setDisplay(display === "0" ? String(num) : display + num);
    }
  };

  const inputOperation = (nextOperation) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForNext(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue, secondValue, operation) => {
    switch (operation) {
      case "+":
        return firstValue + secondValue;
      case "-":
        return firstValue - secondValue;
      case "×":
        return firstValue * secondValue;
      case "÷":
        return firstValue / secondValue;
      case "=":
        return secondValue;
      default:
        return secondValue;
    }
  };

  const performCalculation = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForNext(true);
    }
  };

  const clear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNext(false);
  };

  const deleteLast = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const inputDecimal = () => {
    if (waitingForNext) {
      setDisplay("0.");
      setWaitingForNext(false);
    } else if (display.indexOf(".") === -1) {
      setDisplay(display + ".");
    }
  };

  const scientificOperation = (func) => {
    const value = parseFloat(display);
    let result;
    
    switch (func) {
      case "sin":
        result = Math.sin(value * Math.PI / 180); // Convert to radians
        break;
      case "cos":
        result = Math.cos(value * Math.PI / 180);
        break;
      case "tan":
        result = Math.tan(value * Math.PI / 180);
        break;
      case "log":
        result = Math.log10(value);
        break;
      case "ln":
        result = Math.log(value);
        break;
      case "sqrt":
        result = Math.sqrt(value);
        break;
      case "square":
        result = value * value;
        break;
      case "cube":
        result = value * value * value;
        break;
      case "reciprocal":
        result = 1 / value;
        break;
      case "factorial":
        result = factorial(value);
        break;
      default:
        result = value;
    }
    
    setDisplay(String(result));
    setWaitingForNext(true);
  };

  const factorial = (n) => {
    if (n < 0 || n !== Math.floor(n)) return NaN;
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  };

  const addConstant = (constant) => {
    switch (constant) {
      case "pi":
        setDisplay(String(Math.PI));
        break;
      case "e":
        setDisplay(String(Math.E));
        break;
      default:
        break;
    }
    setWaitingForNext(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-80 bg-white dark:bg-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalculatorIcon className="h-5 w-5" />
            Calculator
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {/* Display */}
          <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg mb-4">
            <div className="text-right text-2xl font-mono overflow-hidden">
              {display}
            </div>
          </div>

          {/* Scientific Functions Row */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <Button variant="outline" size="sm" onClick={() => scientificOperation("sin")} className="text-xs">
              sin
            </Button>
            <Button variant="outline" size="sm" onClick={() => scientificOperation("cos")} className="text-xs">
              cos
            </Button>
            <Button variant="outline" size="sm" onClick={() => scientificOperation("tan")} className="text-xs">
              tan
            </Button>
            <Button variant="outline" size="sm" onClick={() => scientificOperation("log")} className="text-xs">
              log
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-3">
            <Button variant="outline" size="sm" onClick={() => scientificOperation("ln")} className="text-xs">
              ln
            </Button>
            <Button variant="outline" size="sm" onClick={() => scientificOperation("sqrt")} className="text-xs">
              √
            </Button>
            <Button variant="outline" size="sm" onClick={() => scientificOperation("square")} className="text-xs">
              x²
            </Button>
            <Button variant="outline" size="sm" onClick={() => addConstant("pi")} className="text-xs">
              π
            </Button>
          </div>

          {/* Main Calculator Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {/* Row 1 */}
            <Button variant="outline" onClick={clear} className="text-red-600">
              AC
            </Button>
            <Button variant="outline" onClick={deleteLast}>
              <Delete className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => addConstant("e")} className="text-xs">
              e
            </Button>
            <Button variant="outline" onClick={() => inputOperation("÷")}>
              ÷
            </Button>

            {/* Row 2 */}
            <Button variant="outline" onClick={() => inputNumber(7)}>
              7
            </Button>
            <Button variant="outline" onClick={() => inputNumber(8)}>
              8
            </Button>
            <Button variant="outline" onClick={() => inputNumber(9)}>
              9
            </Button>
            <Button variant="outline" onClick={() => inputOperation("×")}>
              ×
            </Button>

            {/* Row 3 */}
            <Button variant="outline" onClick={() => inputNumber(4)}>
              4
            </Button>
            <Button variant="outline" onClick={() => inputNumber(5)}>
              5
            </Button>
            <Button variant="outline" onClick={() => inputNumber(6)}>
              6
            </Button>
            <Button variant="outline" onClick={() => inputOperation("-")}>
              -
            </Button>

            {/* Row 4 */}
            <Button variant="outline" onClick={() => inputNumber(1)}>
              1
            </Button>
            <Button variant="outline" onClick={() => inputNumber(2)}>
              2
            </Button>
            <Button variant="outline" onClick={() => inputNumber(3)}>
              3
            </Button>
            <Button variant="outline" onClick={() => inputOperation("+")} className="row-span-2">
              +
            </Button>

            {/* Row 5 */}
            <Button variant="outline" onClick={() => inputNumber(0)} className="col-span-2">
              0
            </Button>
            <Button variant="outline" onClick={inputDecimal}>
              .
            </Button>
            {/* + button spans two rows */}
          </div>

          {/* Equals button */}
          <div className="mt-2">
            <Button 
              onClick={performCalculation} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              =
            </Button>
          </div>

          {/* Quick Copy */}
          <div className="mt-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigator.clipboard.writeText(display)}
              className="w-full text-xs"
            >
              Copy Result
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
