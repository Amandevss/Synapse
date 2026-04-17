import jwt from "jsonwebtoken";
export const userMiddleware = (req, res, next) => {
    const header = req.headers["authorization"];
    const decoded = jwt.verify(header, process.env.JWT_SECRET);
    if (decoded) {
        //@ts-ignore
        req.userId = decoded.id;
        next();
    }
    else {
        res.status(401).json({
            message: "Unauthorized"
        });
    }
};
//# sourceMappingURL=middleware.js.map