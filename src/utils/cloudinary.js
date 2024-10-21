import { v2 as cloudinary } from "cloudinary"
import fs from "fs" // from nodejs file system, read, delete, write files

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
          if(!localFilePath) return null
          //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
          })
        // file has been uploaded successfully
        fs.unlinkSync(localFilePath)
        return response;
        
    }catch(err) {
       fs.unlinkSync(localFilePath) //remove the locally saved temprorery file as the uploaded operation got failed
       return null;
    }
}

export {uploadOnCloudinary}

/*const uploadResult = cloudinary.uploader
       .upload(
           'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', 
           {
               public_id: 'shoes',
           }
       )
       .catch((error) => {
           console.log(error);
       });

       console.log(uploadResult)*/
