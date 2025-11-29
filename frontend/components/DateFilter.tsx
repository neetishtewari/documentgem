"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format, subMonths, subQuarters, startOfYear, startOfMonth, startOfQuarter, endOfToday } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export type DateRange = {
    from: Date | undefined
    to: Date | undefined
}

interface DateFilterProps {
    onFilterChange: (range: DateRange) => void
}

export function DateFilter({ onFilterChange }: DateFilterProps) {
    const [date, setDate] = React.useState<DateRange>({
        from: undefined,
        to: undefined,
    })
    const [preset, setPreset] = React.useState<string>("all")

    const handlePresetChange = (value: string) => {
        setPreset(value)
        const today = endOfToday()
        let range: DateRange = { from: undefined, to: undefined }

        switch (value) {
            case "this_month":
                range = { from: startOfMonth(today), to: today }
                break
            case "this_quarter":
                range = { from: startOfQuarter(today), to: today }
                break
            case "ytd":
                range = { from: startOfYear(today), to: today }
                break
            case "all":
            default:
                range = { from: undefined, to: undefined }
                break
        }

        setDate(range)
        onFilterChange(range)
    }

    const handleCalendarSelect = (range: any) => {
        // range from react-day-picker can be undefined or have from/to
        const newRange = { from: range?.from, to: range?.to }
        setDate(newRange)
        setPreset("custom")
        if (newRange.from && newRange.to) {
            onFilterChange(newRange)
        }
    }

    return (
        <div className="flex items-center gap-2">
            <Select value={preset} onValueChange={handlePresetChange}>
                <SelectTrigger className="w-[180px] bg-white">
                    <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="this_month">This Month</SelectItem>
                    <SelectItem value="this_quarter">This Quarter</SelectItem>
                    <SelectItem value="ytd">Year to Date</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
            </Select>

            {preset === "custom" && (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-[240px] justify-start text-left font-normal bg-white",
                                !date?.from && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (
                                date.to ? (
                                    <>
                                        {format(date.from, "LLL dd, y")} -{" "}
                                        {format(date.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(date.from, "LLL dd, y")
                                )
                            ) : (
                                <span>Pick a date</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date as any}
                            onSelect={handleCalendarSelect}
                            numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>
            )}
        </div>
    )
}
