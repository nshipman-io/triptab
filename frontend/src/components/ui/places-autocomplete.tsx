import { useEffect, useRef, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { MapPin, Loader2, X, Search } from 'lucide-react'

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
  const [isMobile, setIsMobile] = useState(false)
  const [mobileModalOpen, setMobileModalOpen] = useState(false)
  const [mobileInputValue, setMobileInputValue] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Sync external value changes
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Focus mobile input when modal opens
  useEffect(() => {
    if (mobileModalOpen && mobileInputRef.current) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        mobileInputRef.current?.focus()
      }, 100)
    }
  }, [mobileModalOpen])

  // Prevent body scroll when mobile modal is open
  useEffect(() => {
    if (mobileModalOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [mobileModalOpen])

  // Click outside handler for desktop
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node
      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  const searchPlaces = async (input: string) => {
    if (!input || input.length < 2) {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        new URLSearchParams({
          q: input,
          format: 'json',
          addressdetails: '1',
          limit: '5',
        }),
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch places')
      }

      const data: NominatimResult[] = await response.json()
      setResults(data)
      // Only auto-open dropdown on desktop
      if (data.length > 0 && window.innerWidth >= 768) {
        setIsOpen(true)
      }
    } catch (error) {
      console.error('Places autocomplete error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchResults = useDebouncedCallback(searchPlaces, 400)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setSelectedIndex(-1)
    fetchResults(newValue)
  }

  const handleMobileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setMobileInputValue(newValue)
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
    setMobileModalOpen(false)
    setMobileInputValue('')
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return

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
        setMobileModalOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleFocus = () => {
    if (isMobile) {
      // On mobile, open the full-screen modal instead
      setMobileInputValue(inputValue)
      setMobileModalOpen(true)
      if (inputValue.length >= 2) {
        fetchResults(inputValue)
      }
    } else if (results.length > 0) {
      setIsOpen(true)
    }
  }

  const closeMobileModal = () => {
    setMobileModalOpen(false)
    setMobileInputValue('')
    setResults([])
  }

  return (
    <>
      {/* Main input - works as trigger on mobile, full input on desktop */}
      <div ref={containerRef} className={cn('relative', className)}>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={isMobile}
            className={cn("pl-9 pr-9", isMobile && "cursor-pointer")}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          {isLoading && !isMobile && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground pointer-events-none" />
          )}
        </div>

        {/* Desktop dropdown */}
        {!isMobile && isOpen && results.length > 0 && (
          <div
            className="absolute left-0 right-0 top-full mt-1 rounded-md border bg-white shadow-lg z-50"
          >
            <ul className="max-h-[300px] overflow-auto py-1">
              {results.map((result, index) => {
                const formatted = formatDisplayName(result)
                return (
                  <li
                    key={result.place_id}
                    role="option"
                    aria-selected={index === selectedIndex}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      handleSelectResult(result)
                    }}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 text-sm cursor-pointer select-none',
                      index === selectedIndex
                        ? 'bg-gray-100'
                        : 'hover:bg-gray-50'
                    )}
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                    <div className="flex flex-col overflow-hidden min-w-0">
                      <span className="truncate font-medium text-gray-900">
                        {formatted.main}
                      </span>
                      {formatted.secondary && (
                        <span className="truncate text-xs text-gray-500">
                          {formatted.secondary}
                        </span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="border-t px-3 py-2 text-xs text-gray-400">
              Data © OpenStreetMap contributors
            </div>
          </div>
        )}
      </div>

      {/* Mobile full-screen modal */}
      {isMobile && mobileModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-sand flex flex-col">
          {/* Modal header with search input */}
          <div className="safe-area-top bg-sand">
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                onClick={closeMobileModal}
                className="p-1 text-ink-light active:text-ink"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex-1 relative">
                <input
                  ref={mobileInputRef}
                  type="text"
                  value={mobileInputValue}
                  onChange={handleMobileInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  className="w-full px-4 py-2.5 text-base bg-cream rounded-xl border border-sand-dark outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
                {isLoading && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-light" />
                )}
                {!isLoading && mobileInputValue && (
                  <button
                    onClick={() => {
                      setMobileInputValue('')
                      setResults([])
                      mobileInputRef.current?.focus()
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-ink-light active:text-ink rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-auto bg-cream" style={{ WebkitOverflowScrolling: 'touch' }}>
            {results.length > 0 ? (
              <ul className="divide-y divide-sand-dark">
                {results.map((result, index) => {
                  const formatted = formatDisplayName(result)
                  return (
                    <li
                      key={result.place_id}
                      role="option"
                      aria-selected={index === selectedIndex}
                      onClick={() => handleSelectResult(result)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-4 cursor-pointer select-none active:bg-sand transition-colors',
                        index === selectedIndex && 'bg-sand'
                      )}
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-sand shrink-0">
                        <MapPin className="h-5 w-5 text-forest" />
                      </div>
                      <div className="flex flex-col overflow-hidden min-w-0">
                        <span className="truncate font-medium text-ink">
                          {formatted.main}
                        </span>
                        {formatted.secondary && (
                          <span className="truncate text-sm text-ink-light">
                            {formatted.secondary}
                          </span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : mobileInputValue.length >= 2 && !isLoading ? (
              <div className="p-8 text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-sand mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-ink-light" />
                </div>
                <p className="text-ink-light">No places found for "{mobileInputValue}"</p>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-sand mx-auto mb-4">
                  <Search className="h-8 w-8 text-ink-light" />
                </div>
                <p className="text-ink font-medium mb-1">Search for a destination</p>
                <p className="text-sm text-ink-light">Enter a city or place name</p>
              </div>
            )}
          </div>

          {/* Attribution footer */}
          <div className="bg-cream border-t border-sand-dark px-4 py-2 safe-area-bottom">
            <p className="text-xs text-ink-light text-center">
              Data © OpenStreetMap contributors
            </p>
          </div>
        </div>
      )}
    </>
  )
}
