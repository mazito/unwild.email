// Application error codes. Extend as domains are added.

export const ErrorCode = {
  BadRequest: 400,
  Unauthorized: 401,
  Forbidden: 403,
  NotFound: 404,
  Conflict: 409,
  Unprocessable: 422,
  Internal: 500,
  NotImplemented: 501,
  Unavailable: 503,
  // App-specific (5xx+ reserved range)
  MethodNotFound: 1001,
  InvalidParams: 1002,
  DecodeFailed: 1003,
  EncodeFailed: 1004,
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]
