export type AvailabilityStatus = "AVAILABLE" | "UNAVAILABLE";

export type TimeRange = {
  startTime: string;
  endTime: string;
};

export type AvailabilityInput = {
  candidateSlotId: number;
  status: AvailabilityStatus;
  timeRanges: TimeRange[];
};

export type SubmitAvailabilitiesRequest = {
  availabilities: AvailabilityInput[];
};

export type SubmitAvailabilitiesResponse = {
  updatedCount: number;
};

export type ParticipantAvailability = {
  id: number;
  displayName: string;
  timeRanges: TimeRange[];
};

export type AvailabilitySlotStatus = {
  id: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  availableParticipants: ParticipantAvailability[];
  unavailableParticipants: ParticipantAvailability[];
};

export type AvailabilitiesStatus = {
  slots: AvailabilitySlotStatus[];
};
