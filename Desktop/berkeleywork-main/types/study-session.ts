export interface UserData {
  _id: string;
  fullName: string;
  email: string;
  image?: string;
}

export interface Participant {
  user: UserData;
  joinedAt: string;
}

export interface PendingRequest {
  _id: string;
  user: UserData;
  requestedAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface StudySession {
  _id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  participants: Participant[];
  pendingRequests: PendingRequest[];
  isPrivate: boolean;
  createdBy: UserData;
  createdAt: string;
  updatedAt: string;
  class: string;
} 