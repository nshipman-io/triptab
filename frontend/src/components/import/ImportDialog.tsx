import { useState } from 'react'
import { Mail, Loader2, Check, AlertCircle, Plane, Hotel, Car, MapPin, Utensils } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { api } from '@/lib/api'
import type { ParsedReservation } from '@/types'
import { cn } from '@/lib/utils'

const TYPE_ICONS: Record<string, React.ReactNode> = {
  flight: <Plane className="h-5 w-5" />,
  hotel: <Hotel className="h-5 w-5" />,
  car: <Car className="h-5 w-5" />,
  activity: <MapPin className="h-5 w-5" />,
  restaurant: <Utensils className="h-5 w-5" />,
}

interface ImportDialogProps {
  tripId: string
  onSuccess: () => void
  onClose: () => void
}

type ImportStep = 'paste' | 'parsing' | 'preview' | 'confirming' | 'success' | 'error'

export function ImportDialog({ tripId, onSuccess, onClose }: ImportDialogProps) {
  const [step, setStep] = useState<ImportStep>('paste')
  const [emailContent, setEmailContent] = useState('')
  const [parsedData, setParsedData] = useState<ParsedReservation | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleParse = async () => {
    if (!emailContent.trim()) return

    setStep('parsing')
    setError(null)

    try {
      const result = await api.parseImport(tripId, emailContent)
      setParsedData(result as ParsedReservation)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse email')
      setStep('error')
    }
  }

  const handleConfirm = async () => {
    if (!parsedData) return

    setStep('confirming')

    try {
      await api.confirmImport(tripId, parsedData as unknown as Record<string, unknown>)
      setStep('success')
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import')
      setStep('error')
    }
  }

  const handleBack = () => {
    setStep('paste')
    setParsedData(null)
    setError(null)
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Import Reservation
        </CardTitle>
        <CardDescription>
          Paste a confirmation email to automatically add it to your itinerary
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Step 1: Paste Email */}
        {step === 'paste' && (
          <div className="space-y-4">
            <textarea
              className="w-full h-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Paste your confirmation email here..."
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={handleParse} disabled={!emailContent.trim()}>
                Parse Email
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Parsing */}
        {step === 'parsing' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Analyzing email...</p>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && parsedData && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {TYPE_ICONS[parsedData.type]}
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold">{parsedData.title}</h3>
                  <div className="grid gap-1 text-sm text-muted-foreground">
                    <p>
                      <span className="font-medium">Type:</span>{' '}
                      {parsedData.type.charAt(0).toUpperCase() + parsedData.type.slice(1)}
                    </p>
                    <p>
                      <span className="font-medium">Date:</span>{' '}
                      {parsedData.start_date}
                      {parsedData.end_date && ` - ${parsedData.end_date}`}
                    </p>
                    {parsedData.location && (
                      <p>
                        <span className="font-medium">Location:</span> {parsedData.location}
                      </p>
                    )}
                    {parsedData.confirmation_number && (
                      <p>
                        <span className="font-medium">Confirmation:</span>{' '}
                        {parsedData.confirmation_number}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Confidence indicator */}
              <div className="mt-4 flex items-center gap-2 text-sm">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    parsedData.confidence >= 0.8 ? "bg-green-500" :
                    parsedData.confidence >= 0.5 ? "bg-yellow-500" : "bg-red-500"
                  )}
                />
                <span className="text-muted-foreground">
                  {parsedData.confidence >= 0.8 ? 'High confidence' :
                   parsedData.confidence >= 0.5 ? 'Medium confidence' : 'Low confidence'}
                  {' '}({Math.round(parsedData.confidence * 100)}%)
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleConfirm}>
                Add to Itinerary
              </Button>
              <Button variant="outline" onClick={handleBack}>
                Try Again
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Confirming */}
        {step === 'confirming' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Adding to itinerary...</p>
          </div>
        )}

        {/* Step 5: Success */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Check className="h-8 w-8" />
            </div>
            <p className="mt-4 font-semibold">Successfully imported!</p>
          </div>
        )}

        {/* Error State */}
        {step === 'error' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertCircle className="h-8 w-8" />
              </div>
              <p className="mt-4 font-semibold">Import Failed</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleBack}>
                Try Again
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
