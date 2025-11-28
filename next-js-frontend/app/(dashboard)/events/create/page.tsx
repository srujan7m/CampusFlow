"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Calendar, MapPin, DollarSign, MessageSquare, Loader2 } from "lucide-react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PageHeader } from "@/components/core/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useCreateEvent } from "@/hooks/use-events"
import { useAuthStore } from "@/lib/store/auth-store"
import { toast } from "sonner"
import type { EventFormData } from "@/types/event"

export default function CreateEventPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const createEvent = useCreateEvent()

  const [formData, setFormData] = useState<EventFormData>({
    name: "",
    description: "",
    address: "",
    lat: "",
    lng: "",
    date: "",
    ticketPrice: "",
    telegramChatId: "",
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.id) {
      toast.error("You must be logged in to create an event")
      return
    }

    try {
      const eventData = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        lat: parseFloat(formData.lat) || 0,
        lng: parseFloat(formData.lng) || 0,
        date: formData.date,
        ticketPrice: parseFloat(formData.ticketPrice) || 0,
        telegramChatId: formData.telegramChatId || undefined,
        userId: user.id,
      }

      console.log("Submitting event data:", eventData)

      const event = await createEvent.mutateAsync(eventData)
      console.log("Event created successfully:", event)
      toast.success("Event created successfully!")
      router.push(`/events/${event.code}/manage`)
    } catch (error: any) {
      console.error("Failed to create event:", error)
      toast.error(error.message || "Failed to create event")
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title="Create Event" description="Set up a new event for your attendees">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </PageHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl"
        >
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>
                Fill in the information below to create your event
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Event Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Enter event name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Describe your event..."
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      required
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4" />
                    Location
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="Enter event address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lat">Latitude</Label>
                      <Input
                        id="lat"
                        name="lat"
                        type="number"
                        step="any"
                        placeholder="e.g., 28.6139"
                        value={formData.lat}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lng">Longitude</Label>
                      <Input
                        id="lng"
                        name="lng"
                        type="number"
                        step="any"
                        placeholder="e.g., 77.2090"
                        value={formData.lng}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Date & Price */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Date & Time
                      </Label>
                      <Input
                        id="date"
                        name="date"
                        type="datetime-local"
                        value={formData.date}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ticketPrice" className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Ticket Price (₹)
                      </Label>
                      <Input
                        id="ticketPrice"
                        name="ticketPrice"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.ticketPrice}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Telegram Integration */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MessageSquare className="h-4 w-4" />
                    Telegram Integration (Optional)
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telegramChatId">Telegram Chat ID</Label>
                    <Input
                      id="telegramChatId"
                      name="telegramChatId"
                      placeholder="Enter Telegram chat ID for notifications"
                      value={formData.telegramChatId}
                      onChange={handleChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      Connect your event to a Telegram group for support queries and polls
                    </p>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createEvent.isPending}>
                    {createEvent.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Event
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
