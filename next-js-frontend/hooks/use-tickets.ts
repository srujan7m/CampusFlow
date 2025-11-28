"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ticketsApi } from "@/lib/api/tickets";
import { TicketReplyData, UpdateTicketStatusData } from "@/types/event";

// Query keys
export const ticketKeys = {
  all: ["tickets"] as const,
  lists: () => [...ticketKeys.all, "list"] as const,
  list: (eventCode: string) => [...ticketKeys.lists(), eventCode] as const,
};

// Get tickets for an event
export function useTickets(eventCode: string) {
  return useQuery({
    queryKey: ticketKeys.list(eventCode),
    queryFn: () => ticketsApi.getTickets(eventCode),
    enabled: !!eventCode && eventCode !== "undefined",
  });
}

// Reply to a ticket
export function useReplyToTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TicketReplyData) => ticketsApi.replyToTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
    },
  });
}

// Update ticket status
export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateTicketStatusData) => ticketsApi.updateTicketStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
    },
  });
}
