import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { userModel, contentModel } from './db.js';
import { userMiddleware } from './middleware.js';
const app = express();
app.use(express.json());
app.post("/api/v1/signup", async (req, res) => {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const username = req.body.username;
    try {
        await userModel.create({
            username: username,
            password: hashedPassword
        });
        res.json({
            message: "User signed up"
        });
    }
    catch (err) {
        res.status(400).json({
            message: "user already exists",
        });
    }
});
app.post("/api/v1/signin", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const user = await userModel.findOne({
        username
    });
    if (!user) {
        return res.status(400).json({
            message: "Invalid credentials"
        });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (isPasswordValid) {
        const token = jwt.sign({
            id: user._id,
        }, process.env.JWT_SECRET, {
            expiresIn: "1h"
        });
        res.json({
            message: "User signed in",
            token
        });
    }
    else {
        res.status(400).json({
            message: "Invalid credentials"
        });
    }
});
app.post("/api/v1/content", userMiddleware, async (req, res) => {
    const title = req.body.title;
    const link = req.body.link;
    try {
        const created = await contentModel.create({
            title,
            link,
            // @ts-ignore
            userId: req.userId,
            tags: []
        });
        return res.status(201).json({
            message: "Content added",
            content: created
        });
    }
    catch (err) {
        return res.status(500).json({
            message: "Failed to add content",
            error: err instanceof Error ? err.message : String(err)
        });
    }
});
app.get("/api/v1/content", userMiddleware, async (req, res) => {
    try {
        const content = await contentModel.find({
            // @ts-ignore
            userId: req.userId
        });
        res.json({
            content
        });
    }
    catch (err) {
        res.status(500).json({
            message: "Failed to fetch content"
        });
    }
});
app.delete("/api/v1/content", userMiddleware, async (req, res) => {
    try {
        await contentModel.deleteOne({
            _id: req.params.id,
            // @ts-ignore
            userId: req.userId
        });
        res.json({
            message: "Content deleted"
        });
    }
    catch (err) {
        res.status(500).json({
            message: "Failed to delete content"
        });
    }
});
app.post("api/v1/brain/share", (req, res) => {
});
app.get("api/v1/brain/:shareLink", (req, res) => {
});
app.listen(3000, () => {
    console.log("Server started on port 3000");
});
//# sourceMappingURL=index.js.map