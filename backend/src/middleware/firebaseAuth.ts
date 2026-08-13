import type { Request, Response, NextFunction } from "express";
import * as admin from "firebase-admin";
import AppError from "../errors/AppError";
import { getFirebaseAdminApp } from "../firebase/firebaseAdmin";

export async function verifyFirebaseToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    next(
      new AppError({
        status: 401,
        code: "UNAUTHENTICATED",
        message: "Missing or malformed Authorization header.",
      }),
    );
    return;
  }

  try {
    getFirebaseAdminApp();
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (err) {
    next(
      new AppError({
        status: 401,
        code: "UNAUTHENTICATED",
        message: "Invalid or expired Firebase ID token.",
        cause: err,
      }),
    );
  }
}

export default { verifyFirebaseToken };
