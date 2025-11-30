"use client"

import { useState } from "react"
import { CalendarIcon, Mail } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface IntegrationConfigDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onConnect: (config: { lookbackDays: number; customDate?: Date }) => void
}

export function IntegrationConfigDialog({
    isOpen,
    onOpenChange,
    onConnect,
}: IntegrationConfigDialogProps) {
    const [lookbackPeriod, setLookbackPeriod] = useState("90")
    const [customDate, setCustomDate] = useState<Date | undefined>(undefined)

    const handleConnect = () => {
        let days = parseInt(lookbackPeriod)
        if (lookbackPeriod === "custom" && customDate) {
            // Calculate days difference
            const diffTime = Math.abs(new Date().getTime() - customDate.getTime())
            days = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        }

        onConnect({
            lookbackDays: days,
            customDate: lookbackPeriod === "custom" ? customDate : undefined
        })
        onOpenChange(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="p-2 bg-red-100 rounded-full">
                            <Mail className="h-5 w-5 text-red-600" />
                        </div>
                        Connect Gmail
                    </DialogTitle>
                    <DialogDescription>
                        Choose how far back we should look for documents. We'll only fetch attachments from this period onwards.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label htmlFor="period" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Lookback Period
                        </label>
                        <Select value={lookbackPeriod} onValueChange={setLookbackPeriod}>
                            <SelectTrigger id="period">
                                <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="30">Last 30 Days</SelectItem>
                                <SelectItem value="90">Last 3 Months (Recommended)</SelectItem>
                                <SelectItem value="180">Last 6 Months</SelectItem>
                                <SelectItem value="365">Last 1 Year</SelectItem>
                                <SelectItem value="custom">Custom Start Date</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {lookbackPeriod === "custom" && (
                        <div className="grid gap-2">
                            <label className="text-sm font-medium leading-none">Start Date</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !customDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {customDate ? format(customDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={customDate}
                                        onSelect={setCustomDate}
                                        initialFocus
                                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleConnect} disabled={lookbackPeriod === "custom" && !customDate}>
                        Proceed to Login
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
