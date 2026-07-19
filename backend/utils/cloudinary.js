import { v2 as cloudinary } from 'cloudinary'

// fs import hata diya — ab humein disk se file delete karne ki
// zaroorat nahi, kyunki file kabhi disk pe save hi nahi hui
const uploadOnCloudinary = async (fileBuffer) => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_SECRET
    });

    try {
        // cloudinary.uploader.upload() sirf file PATH accept karta hai,
        // buffer nahi. Isliye buffer ke liye upload_stream() use karna
        // padega, jo ek Promise mein wrap kiya hai taaki async/await
        // ke saath easily use ho sake
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { resource_type: "auto" },
                (error, result) => {
                    if (error) reject(error)
                    else resolve(result)
                }
            )
            stream.end(fileBuffer) // buffer ko stream mein likh kar upload trigger karo
        })

        return result.secure_url
    } catch (error) {
        console.log(error)
    }
}

export default uploadOnCloudinary