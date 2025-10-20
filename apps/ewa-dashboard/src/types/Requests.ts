export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type RequestItem = {
  id: string;
  type: string;
  status: RequestStatus;
  updatedAt: string; // ISO date
};
