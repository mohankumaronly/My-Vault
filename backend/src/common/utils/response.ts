export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export function ok<T>(data: T, message?: string): ApiResponse<T> {
  return message ? { success: true, message, data } : { success: true, data };
}

export function created<T>(data: T, message = "Created"): ApiResponse<T> {
  return { success: true, message, data };
}

export function fail(message: string): ApiResponse {
  return { success: false, message };
}
