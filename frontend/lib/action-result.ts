import { Prisma } from "@prisma/client";
import { UnauthorizedError } from "@/lib/auth";

export type ActionFailure = {
  success: false;
  message: string;
  unauthorized?: boolean;
};

export type ActionResult<T = null> =
  | { success: true; message?: string; data: T }
  | ActionFailure;

// Thrown for expected business-rule failures; the message is shown to the user.
export class ActionError extends Error {}

// Server Action errors are redacted in production, so actions return a
// result object instead of throwing. Known errors keep their message.
export function toErrorResult(error: unknown, fallback: string): ActionFailure {
  if (error instanceof UnauthorizedError) {
    return { success: false, message: error.message, unauthorized: true };
  }

  if (error instanceof ActionError) {
    return { success: false, message: error.message };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return { success: false, message: "Record not found" };
    }

    if (error.code === "P2003") {
      return {
        success: false,
        message: `${fallback}: it is still linked to other records`,
      };
    }
  }

  console.error(fallback, error);
  return { success: false, message: fallback };
}
