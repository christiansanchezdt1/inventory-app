"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Search, X } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

export interface CustomerFilters {
  search: string
  dateFrom: Date | undefined
  dateTo: Date | undefined
  hasOrders: string
}

interface CustomerFiltersProps {
  filters: CustomerFilters
  onFilterChange: (filters: CustomerFilters) => void
  onResetFilters: () => void
}

export default function CustomerFilters({ filters, onFilterChange, onResetFilters }: CustomerFiltersProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

  const hasOrdersOptions = [
    { value: "all", label: "Todos los clientes" },
    { value: "yes", label: "Con pedidos" },
    { value: "no", label: "Sin pedidos" },
  ]

  const handleSearchChange = (value: string) => {
    onFilterChange({ ...filters, search: value })
  }

  const handleHasOrdersChange = (value: string) => {
    onFilterChange({ ...filters, hasOrders: value })
  }

  const handleDateFromChange = (date: Date | undefined) => {
    onFilterChange({ ...filters, dateFrom: date })
  }

  const handleDateToChange = (date: Date | undefined) => {
    onFilterChange({ ...filters, dateTo: date })
  }

  const hasActiveFilters =
    filters.hasOrders !== "all" ||
    filters.dateFrom !== undefined ||
    filters.dateTo !== undefined ||
    filters.search !== ""

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre, email o teléfono..."
            className="pl-8"
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className={cn(isAdvancedOpen && "bg-accent")}
        >
          Filtros avanzados
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={onResetFilters} className="px-3">
            <X className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
        )}
      </div>

      {isAdvancedOpen && (
        <div className="grid gap-4 p-4 border rounded-md bg-card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hasOrders">Estado de pedidos</Label>
              <Select value={filters.hasOrders} onValueChange={handleHasOrdersChange}>
                <SelectTrigger id="hasOrders">
                  <SelectValue placeholder="Todos los clientes" />
                </SelectTrigger>
                <SelectContent>
                  {hasOrdersOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fecha de alta desde</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateFrom && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateFrom ? (
                      format(filters.dateFrom, "PPP", { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={handleDateFromChange}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Fecha de alta hasta</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateTo && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateTo ? format(filters.dateTo, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={handleDateToChange}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
