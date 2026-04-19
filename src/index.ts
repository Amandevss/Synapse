import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { userModel, contentModel } from './db.js';

import { userMiddleware } from './middleware.js';

declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}

const app = express();
app.use(express.json());


app.post("/api/v1/signup", async (req, res) => {

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    

    const username = req.body.username;

    try{
    await userModel.create({
        username : username,
        password : hashedPassword
    })

    res.json({
        message : "User signed up"
    })
    }catch(err){
        res.status(400).json({
            message : "user already exists",
        })
    }

});

app.post("/api/v1/signin", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const user = await userModel.findOne({
        username
    })
    if(!user){
        return res.status(400).json({
            message : "Invalid credentials"
        })
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if(isPasswordValid){
        const token = jwt.sign({
            id: user._id,
        }, process.env.JWT_SECRET as string, {
        expiresIn : "1h"
        })

        res.json({
            message : "User signed in",
            token
        })
    }
    else{
        res.status(400).json({
            message : "Invalid credentials"
        })
    }
});

app.post("/api/v1/content", userMiddleware, async (req, res) => {
    const title = req.body.title;
    const link = req.body.link;
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const created = await contentModel.create({
            title,
            link,
            userId: new mongoose.Types.ObjectId(userId),
            tags: []
        })

        return res.status(201).json({
            message: "Content added",
            content: created
        })
    } catch (err) {
        return res.status(500).json({
            message : "Failed to add content",
            error : err instanceof Error ? err.message : String(err)
        })
    }
});

app.get("/api/v1/content", userMiddleware, async (req, res) => {
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const content = await contentModel.find({
            userId: new mongoose.Types.ObjectId(userId)
        });

        res.json({
            content
        });
    } catch (err) {
        res.status(500).json({
            message: "Failed to fetch content"
        });
    }
});

app.delete("/api/v1/content", userMiddleware, async (req, res) => {
    const contentId = req.body.contentId;
    const userId = req.userId;

    if (!contentId) {
        return res.status(400).json({ message: "contentId is required" });
    }

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const result = await contentModel.findOneAndDelete({
            _id: new mongoose.Types.ObjectId(contentId),
            userId: new mongoose.Types.ObjectId(userId)
        });

        if (!result) {
            return res.status(404).json({ message: "Content not found" });
        }

        res.json({
            message: "Content deleted"
        });
    } catch (err) {
        res.status(500).json({
            message: "Failed to delete content"
        });
    }
});

const generateShareLink = () => crypto.randomBytes(8).toString('hex');

app.post("/api/v1/brain/share", userMiddleware, async (req, res) => {
    const { contentId } = req.body;
    if (!contentId) {
        return res.status(400).json({ message: "contentId is required" });
    }

    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const content = await contentModel.findById(contentId);
        if (!content || content.userId?.toString() !== userId) {
            return res.status(404).json({ message: "Content not found" });
        }

        if (!content.shareLink) {
            content.shareLink = generateShareLink();
            content.sharedAt = new Date();
            await content.save();
        }

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const shareUrl = `${baseUrl}/api/v1/brain/${content.shareLink}`;

        return res.status(200).json({
            message: "Share link created",
            shareLink: content.shareLink,
            shareUrl,
            content: {
                id: content._id,
                title: content.title,
                link: content.link
            }
        });
    } catch (err) {
        return res.status(500).json({
            message: "Failed to create share link",
            error: err instanceof Error ? err.message : String(err)
        });
    }
});

app.get("/api/v1/brain/:shareLink", async (req, res) => {
    const { shareLink } = req.params;

    try {
        const content = await contentModel.findOne({ shareLink });

        if (!content) {
            return res.status(404).json({ message: "Shared content not found" });
        }

        return res.json({
            content: {
                id: content._id,
                title: content.title,
                link: content.link,
                sharedAt: content.sharedAt
            }
        });
    } catch (err) {
        return res.status(500).json({
            message: "Failed to retrieve shared content",
            error: err instanceof Error ? err.message : String(err)
        });
    }
});

app.listen(3000, () => {
    console.log("Server started on port 3000");
});