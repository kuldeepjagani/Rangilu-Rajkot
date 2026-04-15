import { Response } from "express";

interface ApiResponsePayload<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
}

export class ApiResponse {
  static success<T>(res: Response, data?: T, message = "Success", statusCode = 200, meta?: Record<string, unknown>) {
    const payload: ApiResponsePayload<T> = { success: true, message };
    if (data !== undefined) payload.data = data;
    if (meta) payload.meta = meta;
    return res.status(statusCode).json(payload);
  }

  static created<T>(res: Response, data?: T, message = "Created successfully") {
    return ApiResponse.success(res, data, message, 201);
  }

  static noContent(res: Response) {
    return res.status(204).send();
  }

  static error(res: Response, statusCode: number, message: string) {
    return res.status(statusCode).json({ success: false, message });
  }
}
