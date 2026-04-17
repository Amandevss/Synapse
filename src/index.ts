import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { userModel} from './db.js';



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



app.listen(3000, () => {
    console.log("Server started on port 3000");
});