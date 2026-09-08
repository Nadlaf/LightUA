export interface StatusResponseDto {
  last_update: {
    timestamp: string | null;
    status: 'pending' | 'running' | 'success' | 'error';
    message: string;
  };
  parsing_in_progress: boolean;
  auto_update_interval_minutes: number;
}
