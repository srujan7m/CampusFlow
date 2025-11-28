"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Calendar, MapPin, Plus, ExternalLink, Settings } from "lucide-react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PageHeader } from "@/components/core/page-header"
import { EmptyState } from "@/components/core/empty-state"
import { SkeletonCard } from "@/components/core/skeleton-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEvents } from "@/hooks/use-events"
import { useAuthStore } from "@/lib/store/auth-store"
import { format } from "date-fns"
import type { Event } from "@/types/event"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

function EventCard({ event }: { event: Event }) {
  const router = useRouter()
  const eventDate = new Date(event.date)
  const isUpcoming = eventDate > new Date()

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">{event.name}</CardTitle>
            <CardDescription className="flex items-center gap-1">
              <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                {event.code}
              </span>
            </CardDescription>
          </div>
          <Badge variant={isUpcoming ? "default" : "secondary"}>
            {isUpcoming ? "Upcoming" : "Past"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {(() => {
                try {
                  return format(eventDate, "PPP 'at' p")
                } catch (e) {
                  return "Invalid Date"
                }
              })()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{event.address}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-lg font-semibold">
            ₹{event.ticketPrice}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/events/${event.code}`, "_blank")}
            >
              <ExternalLink className="mr-1 h-3 w-3" />
              Public
            </Button>
            <Button
              size="sm"
              onClick={() => router.push(`/events/${event.code}/manage`)}
            >
              <Settings className="mr-1 h-3 w-3" />
              Manage
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function EventsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { data: events, isLoading, error } = useEvents(user?.id)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Events"
          description="Manage your events and track registrations"
        >
          <Button onClick={() => router.push("/events/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </PageHeader>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : error ? (
          <Card className="p-6">
            <p className="text-destructive">Failed to load events. Please try again.</p>
          </Card>
        ) : events && events.length > 0 ? (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {events.map((event) => (
              <motion.div key={event.id} variants={item}>
                <EventCard event={event} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <EmptyState
            icon={Calendar}
            title="No events yet"
            description="Create your first event to start managing registrations and engaging with attendees."
            actionLabel="Create Event"
            onAction={() => router.push("/events/create")}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
