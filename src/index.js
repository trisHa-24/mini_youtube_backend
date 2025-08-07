import dotenv from "dotenv";
dotenv.config({
    path: "./.env"
})

import app from "./app.js";
import connectDB from "./db/index.js";


connectDB()
.then(() => {
   const server = app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️  Server is running on port ${process.env.PORT || 8000}`);
    });
    server.on("error", (error) => {
        console.log("Error while starting server", error);
        throw error;
    });    
})
.catch((error) => {
    console.log("Error connecting to MongoDB:", error);   
})