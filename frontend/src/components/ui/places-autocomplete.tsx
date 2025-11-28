import { useEffect, useRef, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { MapPin, Loader2 } from 'lucide-react'

interface NominatimResult {
  place_id: number
  display_name: string
  name: string
  type: string
  address: {
    city?: string
    town?: string
    village?: string
    state?: string
    country?: string
  }
}

interface PlacesAutocompleteProps {
  value: string
  onChange: (value: string, placeId?: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function PlacesAutocomplete({
  value,
  onChange,
  placeholder = 'Search for a city...',
  className,
  disabled = false,
}: PlacesAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value)
  const [results, setResults] = useState<NominatimResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync external value changes
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchResults = useDebouncedCallback(async (input: string) => {
    if (!input || input.length < 2) {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      // Using OpenStreetMap Nominatim API (free, no API key required)
      // Rate limit: 1 request per second (handled by debounce)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        new URLSearchParams({
          q: input,
          format: 'json',
          addressdetails: '1',
          limit: '5',
          featuretype: 'city',  // Prioritize cities
        }),
        {
          headers: {
            'Accept-Language': 'en',
            // Nominatim requires a valid User-Agent
            'User-Agent': 'Triptab Travel App (contact@example.com)',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch places')
      }

      const data: NominatimResult[] = await response.json()
      setResults(data)
      setIsOpen(true)
    } catch (error) {
      console.error('Places autocomplete error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, 400) // 400ms debounce to respect rate limits

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setSelectedIndex(-1)
    fetchResults(newValue)
  }

  const formatDisplayName = (result: NominatimResult): { main: string; secondary: string } => {
    const address = result.address
    const cityName = address.city || address.town || address.village || result.name
    const parts = []

    if (address.state) parts.push(address.state)
    if (address.country) parts.push(address.country)

    return {
      main: cityName,
      secondary: parts.join(', '),
    }
  }

  const handleSelectResult = (result: NominatimResult) => {
    const formatted = formatDisplayName(result)
    const fullName = formatted.secondary
      ? `${formatted.main}, ${formatted.secondary}`
      : formatted.main

    setInputValue(fullName)
    onChange(fullName, result.place_id.toString())
    setResults([])
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelectResult(results[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleFocus = () => {
    if (results.length > 0) {
      setIsOpen(true)
    }
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-9 pr-9"
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <ul className="max-h-60 overflow-auto py-1">
            {results.map((result, index) => {
              const formatted = formatDisplayName(result)
              return (
                <li
                  key={result.place_id}
                  onClick={() => handleSelectResult(result)}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 px-3 py-2 text-sm',
                    index === selectedIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate font-medium">
                      {formatted.main}
                    </span>
                    {formatted.secondary && (
                      <span className="truncate text-xs text-muted-foreground">
                        {formatted.secondary}
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            Data © OpenStreetMap contributors
          </div>
        </div>
      )}
    </div>
  )
}
