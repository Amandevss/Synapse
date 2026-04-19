import { NextFunction,Request,Response } from "express"
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

export const userMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.headers["authorization"];
    const token = typeof authorization === "string" ? authorization.replace(/^Bearer\s+/i, "") : undefined;

    if (!token) {
        return res.status(401).json({ message: "Authorization token missing" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
        if (!decoded || !decoded.id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        req.userId = decoded.id;
        next();
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: "Token expired" });
        }
        return res.status(401).json({ message: "Invalid token" });
    }
}
