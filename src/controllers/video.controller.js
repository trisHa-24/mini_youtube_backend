import { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


const getAllVideos = asyncHandler(async (req, res) => {
     
})

const publishVideo = asyncHandler(async (req, res) => {
    // get title , dscription from req.body
    // get videoFile and thumbnail from req.files
    // check if videoFile and thumbnail are present
    // validate title and description
    // create new video document

    const {title, description} = req.body
    if(!title || !description){
        throw new ApiError(400, "Title and description are required")
    }

    const videoFilePath  = req.files?.video?.[0]?.path

    if(!videoFilePath){
        throw new ApiError(400, "Video file is required")
    }

    const thumbnailPath = req.files?.thumbnail?.[0]?.path

    if(!thumbnailPath){
        throw new ApiError(400, "Thumbnail is required")
    }
    
    const uploadVideo = await uploadOnCloudinary(videoFilePath)

    if(!uploadVideo){
        throw new ApiError(500, "Failed to upload video to cloud")
    }
    
    const uploadThumbnail = await uploadOnCloudinary(thumbnailPath)

    if(!uploadThumbnail){
        throw new ApiError(500, "Failed to upload thumbnail to cloud")
    }

    const video = await Video.create({
        videoFile: {
            url: uploadVideo.url,
            public_id: uploadVideo.public_id
        },
        thumbnail: {
            url: uploadThumbnail.url,
            public_id: uploadThumbnail.public_id
       },
        title,
        description,
        duration: uploadVideo.duration || 0,
        owner: req.user._id
    })

    if(!video){
        throw new ApiError(500, "Failed to upload the video")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            {   video_id: video._id,
                video_url: uploadVideo.url,
                thumbnail_url: uploadThumbnail.url,
                title,
                description,
                duration: uploadVideo.duration
             },
            "Video published successfully"
        )
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }

    let video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404, "Video not found")
    }
    
    if(video.owner.toString() !== req.user._id.toString()){

        // check watch history and update views count
         const user = await User.findById(req.user._id)
    
        if(user && !user.watchHistory.includes(videoId)){
           user.watchHistory.push(video._id)
           await user.save();
           video = await Video.findByIdAndUpdate(
            videoId, 
            { $inc: { views: 1 } },
            { new: true }
           );
        }
    }

    await video.populate("owner", "username avatar")    

    return res.status(200).json(
    new ApiResponse(
        200,
        {
            video: {
                _id: video._id,
                title: video.title,
                description: video.description,
                views: video.views,
                duration: video.duration,
                videoUrl: video.videoFile.url,
                thumbnailUrl: video.thumbnail.url,
                owner: video.owner,  
                createdAt: video.createdAt
            }
        },
        "Video fetched successfully"
    )
);
})

const updateVideo = asyncHandler(async (req, res) => {
    
})

export {
    getAllVideos,
    publishVideo,
    getVideoById
}