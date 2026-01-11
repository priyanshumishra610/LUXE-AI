export interface ClientRequest {
  rawInput: string;
  timestamp: string;
}

export async function intake(rawInput: string): Promise<ClientRequest> {
  return {
    rawInput: rawInput.trim(),
    timestamp: new Date().toISOString(),
  };
}
