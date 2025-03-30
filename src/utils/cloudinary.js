import { v2 as cloudinary } from 'cloudinary';
import ApiError from './ApiError.js';
import fs from 'fs';


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;
        
        const uploadResult = await cloudinary.uploader.upload(localFilePath, {
               resource_type: 'auto'
           }
        )    
    
        fs.unlinkSync(localFilePath);
        return uploadResult;

    } catch(error) {
        fs.unlinkSync(localFilePath);
        return null;
    }
}

const deleteOnCloudinary = async (imgaeURL) => {
    try {
        if(!imgaeURL) return null;

        // Extract the public_id from the Cloudinary URL
        const publicID = imgaeURL.split('/').pop().split('.')[0]
        
        // Delete the image from Cloudinary
        const res = await cloudinary.uploader.destroy(publicID);

        if(res.result !== "ok") {
            throw new ApiError("Error deleting image from Cloudinary")
        }

        console.log("File deleted successfully!");
    }
    catch(error) {
        throw new ApiError("Error deleting image from Cloudinary")
    }
}

export {
    uploadOnCloudinary,
    deleteOnCloudinary
}