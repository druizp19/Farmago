import * as React from "react"
import { Clock, X } from "lucide-react"
import { Button } from "./button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"
import { cn } from "../../lib/utils"

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function TimePicker({
  value,
  onChange,
  placeholder = "Seleccionar hora",
  className,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const hourRef = React.useRef<HTMLDivElement>(null)

  const selectedHour = value ? parseInt(value.split(":")[0]) : null
  const selectedMinute = value ? parseInt(value.split(":")[1]) : null

  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = [0, 15, 30, 45]

  // Scroll selected hour into view when popover opens
  React.useEffect(() => {
    if (open && selectedHour !== null && hourRef.current) {
      const selectedBtn = hourRef.current.querySelector(
        `[data-hour="${selectedHour}"]`
      ) as HTMLElement
      selectedBtn?.scrollIntoView({ block: "center" })
    }
  }, [open, selectedHour])

  const handleHourClick = (hour: number) => {
    const min = selectedMinute ?? 0
    const timeString = `${hour.toString().padStart(2, "0")}:${min
      .toString()
      .padStart(2, "0")}`
    onChange(timeString)
  }

  const handleMinuteClick = (minute: number) => {
    const hr = selectedHour ?? 0
    const timeString = `${hr.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`
    onChange(timeString)
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-8 gap-1.5 justify-start text-left font-normal text-xs pr-2",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="flex-1">{value || placeholder}</span>
          {value && (
            <span
              role="button"
              onClick={handleClear}
              className="ml-1 rounded-full p-0.5 hover:bg-gray-200 transition-colors"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="p-0 w-[160px] z-[70] overflow-hidden rounded-lg border border-gray-200 shadow-lg"
        align="start"
        sideOffset={4}
      >
        {/* Header */}
        <div className="grid grid-cols-2 border-b border-gray-100 bg-gray-50">
          <span className="px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
            Hora
          </span>
          <span className="px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wide border-l border-gray-100">
            Min
          </span>
        </div>

        {/* Body */}
        <div className="flex bg-white">
          {/* Hours column */}
          <div
            ref={hourRef}
            className="flex-1 h-[200px] overflow-y-auto border-r border-gray-100 scrollbar-thin scrollbar-thumb-gray-200"
          >
            {hours.map((hour) => (
              <button
                key={hour}
                data-hour={hour}
                onClick={() => handleHourClick(hour)}
                className={cn(
                  "w-full px-3 py-[7px] text-sm text-center transition-colors",
                  selectedHour === hour
                    ? "bg-blue-500 text-white font-semibold"
                    : "hover:bg-blue-50 text-gray-700"
                )}
              >
                {hour.toString().padStart(2, "0")}
              </button>
            ))}
          </div>

          {/* Minutes column */}
          <div className="flex-1 flex flex-col h-[200px]">
            {minutes.map((minute) => (
              <button
                key={minute}
                onClick={() => handleMinuteClick(minute)}
                className={cn(
                  "flex-1 px-3 text-sm text-center transition-colors",
                  selectedMinute === minute
                    ? "bg-blue-500 text-white font-semibold"
                    : "hover:bg-blue-50 text-gray-700"
                )}
              >
                {minute.toString().padStart(2, "0")}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}