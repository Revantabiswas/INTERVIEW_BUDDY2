"use client"

import { useState, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"

export default function CodeEditor({ value, onChange, language = "javascript", height = "300px" }) {
  const [code, setCode] = useState(value || "")

  useEffect(() => {
    if (value !== code) {
      setCode(value)
    }
  }, [value])

  const handleChange = (e) => {
    const newCode = e.target.value
    setCode(newCode)
    if (onChange) {
      onChange(newCode)
    }
  }

  return (
    <div className="relative border rounded-md overflow-hidden" style={{ height }}>
      <div className="absolute top-0 right-0 bg-secondary text-xs px-2 py-1 rounded-bl-md">{language}</div>
      <Textarea
        value={code}
        onChange={handleChange}
        className="font-mono text-sm p-4 h-full resize-none"
        style={{
          tabSize: 2,
          height: "100%",
          width: "100%",
          overflow: "auto",
        }}
      />
    </div>
  )
}

