"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DateInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
}

// Componente específico para input de data que evita problemas de timezone
export function DateInput({ id, label, value, onChange, required = false, disabled = false }: DateInputProps) {
  // Função para garantir que a data seja tratada corretamente
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    // Passar o valor exatamente como está no input (YYYY-MM-DD)
    onChange(inputValue)
  }

  // Função para obter a data atual no formato correto para o input
  const getCurrentDate = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} {required && "*"}
      </Label>
      <Input
        id={id}
        type="date"
        value={value || getCurrentDate()}
        onChange={handleDateChange}
        required={required}
        disabled={disabled}
        // Definir min e max para evitar datas muito antigas ou futuras
        min="2020-01-01"
        max="2030-12-31"
      />
    </div>
  )
}
