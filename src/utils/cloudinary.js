import dotenv from "dotenv";
dotenv.config();

import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;
        // upload file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto'
        })
        // after successful upload, get the url
        // console.log(`File uploaded successfully: ${response.url}`);
        fs.unlinkSync(localFilePath); // remove the file from local storage after upload
        return response;

    } catch (error) {
        console.error(`Error uploading file to Cloudinary: ${error.message}`);
        fs.unlinkSync(localFilePath); // remove the file from local storage as the file upload operation got failed
        return null;
    }
}

export { uploadOnCloudinary };