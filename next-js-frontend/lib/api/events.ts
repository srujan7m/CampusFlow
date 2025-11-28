import {
  Event,
  CreateEventData,
  UpdateEventData,
  POI,
  ApiResponse,
} from "@/types/event";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Events API
export const eventsApi = {
  // Get all events for a user
  getEvents: async (userId?: string): Promise<Event[]> => {
    const url = userId ? `${API_URL}/events?userId=${userId}` : `${API_URL}/events`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch events");
    }
    const data = await response.json();
    return data.events || data;
  },

  // Get single event by ID or code
  getEvent: async (idOrCode: string): Promise<Event> => {
    const response = await fetch(`${API_URL}/events/${idOrCode}`);
    if (!response.ok) {
      throw new Error("Failed to fetch event");
    }
    const data = await response.json();
    return data.event || data;
  },

  // Create new event
  createEvent: async (eventData: CreateEventData): Promise<Event> => {
    console.log("API: Creating event with data:", eventData)
    console.log("API: URL:", `${API_URL}/events`)

    const response = await fetch(`${API_URL}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("API: Create event failed:", error)
      throw new Error(error.message || "Failed to create event");
    }

    const data = await response.json();
    console.log("API: Create event success:", data)
    return data.event || data;
  },

  // Update event
  updateEvent: async ({ id, ...eventData }: UpdateEventData): Promise<Event> => {
    const response = await fetch(`${API_URL}/events/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    });
    if (!response.ok) {
      throw new Error("Failed to update event");
    }
    const data = await response.json();
    return data.event || data;
  },

  // Upload document
  uploadDocument: async (
    eventCode: string,
    file: File
  ): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_URL}/events/${eventCode}/documents`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      throw new Error("Failed to upload document");
    }
    return response.json();
  },

  // Upload indoor map
  uploadIndoorMap: async (
    eventCode: string,
    file: File
  ): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_URL}/events/${eventCode}/indoor-map`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      throw new Error("Failed to upload indoor map");
    }
    return response.json();
  },

  // Update POIs on indoor map
  updatePOIs: async (eventCode: string, pois: POI[]): Promise<ApiResponse<null>> => {
    const response = await fetch(`${API_URL}/events/${eventCode}/pois`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pois }),
    });
    if (!response.ok) {
      throw new Error("Failed to update POIs");
    }
    return response.json();
  },
};
