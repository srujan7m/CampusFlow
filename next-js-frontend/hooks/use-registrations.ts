"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { registrationsApi } from "@/lib/api/registrations";
import { CreateRegistrationData, VerifyPaymentData } from "@/types/event";
import { eventKeys } from "./use-events";

// Query keys
export const registrationKeys = {
  all: ["registrations"] as const,
  lists: () => [...registrationKeys.all, "list"] as const,
  list: (eventCode: string) => [...registrationKeys.lists(), eventCode] as const,
};

// Get registrations for an event
export function useRegistrations(eventCode: string) {
  return useQuery({
    queryKey: registrationKeys.list(eventCode),
    queryFn: () => registrationsApi.getRegistrations(eventCode),
    enabled: !!eventCode && eventCode !== "undefined",
  });
}

// Create registration (initiates payment)
export function useCreateRegistration() {
  return useMutation({
    mutationFn: (data: CreateRegistrationData) =>
      registrationsApi.createRegistration(data),
  });
}

// Verify payment
export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VerifyPaymentData) => registrationsApi.verifyPayment(data),
    onSuccess: () => {
      // Invalidate registrations to refresh the list
      queryClient.invalidateQueries({ queryKey: registrationKeys.all });
      // Also invalidate event details as registration count might have changed
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}
