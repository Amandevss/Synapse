import dotenv from 'dotenv';
import mongoose,{ model, Schema } from "mongoose";

dotenv.config();

mongoose.connect(process.env.MONGO_DB_URI as string).then(() => {
    console.log("Connected to MongoDB");
}).catch((err) => {
    console.log("Error connecting to MongoDB", err);
});

const userSchema = new Schema({
    username : {type : String, unique : true, required : true},
    password : {type : String, required : true}
})


export const userModel = model("User", userSchema);



