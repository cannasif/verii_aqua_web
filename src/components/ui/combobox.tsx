import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { VoiceSearchButton } from "@/components/ui/voice-search-button"
import { DROPDOWN_MAX_VISIBLE_ITEMS_CLASS } from "@/components/shared/dropdown/constants"

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  modal?: boolean
  disabled?: boolean
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Seçiniz...",
  searchPlaceholder = "Ara...",
  emptyText = "Sonuç bulunamadı.",
  className,
  modal = false,
  disabled = false
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const selectedOption = options.find((option) => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen} modal={modal}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate min-w-0 flex-1 text-left">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className={cn("ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform", open && "rotate-180")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[--radix-popover-trigger-width] p-0 border border-white/10 bg-[#020712]/95 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden" 
        align="start"
      >
        <Command className="bg-transparent text-white">
          <CommandInput 
            placeholder={searchPlaceholder} 
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="text-[13px] text-white placeholder:text-[#5c7c99] border-b border-white/5"
          >
             <VoiceSearchButton 
                onResult={(text) => setSearchQuery(text)} 
                className="h-7 w-7 mr-1 text-[#5c7c99] hover:text-[#00f7ff] hover:bg-[#00f7ff]/10 transition-colors" 
             />
          </CommandInput>
          <CommandList
            className={cn(
              DROPDOWN_MAX_VISIBLE_ITEMS_CLASS,
              "overflow-y-auto p-1.5 custom-scrollbar space-y-0.5"
            )}
          >
            <CommandEmpty className="py-4 text-center text-[13px] text-[#5c7c99]">{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onValueChange(option.value)
                    setOpen(false)
                  }}
                  className="flex items-center text-[13px] text-[#d0e6ff] aria-selected:bg-[#00f7ff]/15 aria-selected:text-[#00f7ff] cursor-pointer rounded-lg px-3 py-2 transition-all duration-200"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 text-[#00f7ff] transition-opacity",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}