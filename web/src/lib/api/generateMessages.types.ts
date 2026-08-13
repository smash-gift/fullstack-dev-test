export interface GenerateMessagesRequest {
  occasion: string;
  relationship: string;
  regenerate?: boolean;
}

export interface GenerateMessagesResponse {
  messages: string[];
}
