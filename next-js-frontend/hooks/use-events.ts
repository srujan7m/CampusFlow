"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventsApi } from "@/lib/api/events";
import { CreateEventData, UpdateEventData, POI } from "@/types/event";

// Query keys
export const eventKeys = {
  all: ["events"] as const,
  lists: () => [...eventKeys.all, "list"] as const,
  list: (userId?: string) => [...eventKeys.lists(), userId] as const,
  details: () => [...eventKeys.all, "detail"] as const,
  detail: (idOrCode: string) => [...eventKeys.details(), idOrCode] as const,
};

// Get all events
export function useEvents(userId?: string) {
  return useQuery({
    queryKey: eventKeys.list(userId),
    queryFn: () => eventsApi.getEvents(userId),
  });
}

// Get single event
export function useEvent(idOrCode: string) {
  return useQuery({
    queryKey: eventKeys.detail(idOrCode),
    queryFn: () => eventsApi.getEvent(idOrCode),
    enabled: !!idOrCode && idOrCode !== "undefined",
  });
}

// Create event
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventData: CreateEventData) => eventsApi.createEvent(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
}

// Update event
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventData: UpdateEventData) => eventsApi.updateEvent(eventData),
    onSuccess: (data: { id: string; code: string }) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: eventKeys.detail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: eventKeys.detail(data.code),
      });
    },
  });
}

// Upload document
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventCode, file }: { eventCode: string; file: File }) =>
      eventsApi.uploadDocument(eventCode, file),
    onSuccess: (_: unknown, { eventCode }: { eventCode: string; file: File }) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventCode) });
    },
  });
}

// Upload indoor map
export function useUploadIndoorMap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventCode, file }: { eventCode: string; file: File }) =>
      eventsApi.uploadIndoorMap(eventCode, file),
    onSuccess: (_: unknown, { eventCode }: { eventCode: string; file: File }) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventCode) });
    },
  });
}

// Update POIs
export function useUpdatePOIs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventCode, pois }: { eventCode: string; pois: POI[] }) =>
      eventsApi.updatePOIs(eventCode, pois),
    onSuccess: (_: unknown, { eventCode }: { eventCode: string; pois: POI[] }) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventCode) });
    },
  });
}
