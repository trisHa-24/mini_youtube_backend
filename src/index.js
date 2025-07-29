import dotenv from "dotenv";

import connectDB from "./db/index.js";
 
dotenv.config({
    path: "./.env"
})

connectDB()
.then(() => {
   const server = app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port ${process.env.PORT || 8000}`);
    });
    server.on("error", (error) => {
        console.log("Error while starting server", error);
        throw error;
    });    app.get('/user', asyncHandler(getUser));
})
.catch((error) => {
    console.log("Error connecting to MongoDB:", error);   
})