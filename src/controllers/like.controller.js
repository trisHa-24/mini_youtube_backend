import mongoose, {isValidObjectId} from "mongoose";
import {Like} from "../models/like.model.js";
import {Video} from "../models/video.model.js";
// import {Comment} from "../models/comment.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    
    if(!isValidObjectId(videoId)){
        throw new ApiError(404,"Invalid Video Id")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video does not exist")
    }

    const dislikeVideo = await Like.findOneAndDelete({
        video: videoId,
        likedBy: req.user._id
    })

    if(dislikeVideo){
       return res
       .status(200)
       .json(
        new ApiResponse(
            200,
            {liked: false},
            "Video unliked successfully"
        )
       )
    }

    const like = await Like.create(
        {
            video: videoId,
            likedBy: req.user._id
        }
    )
  
    if(!like){
        throw new ApiError(500,"Something went wrong while liking the video");     
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {liked: true},
            "Video liked successfully"
        )
    )
})

// const toggleCommentLike = asyncHandler(async (req, res) => {
//     const {commentId} = req.params
    
    
//     if(!isValidObjectId(commentId)){
//         throw new ApiError(404,"Invalid Video Id")
//     }

//     const comment = await Comment.findById(commentId)

//     if(!comment){
//         throw new ApiError(404, "Comment does not exist")
//     }

//     const dislikeComment = await Comment.findOneAndDelete({
//         video: commentId,
//         likedBy: req.user._id
//     })

//     if(dislikeComment){
//        return res
//        .status(200)
//        .json(
//         new ApiResponse(
//             200,
//             {liked: false},
//             "Comment unliked successfully"
//         )
//        )
//     }

//     const like = await Comment.create(
//         {
//             video: commentId,
//             likedBy: req.user._id
//         }
//     )
  
//     if(!like){
//         throw new ApiError(500,"Something went wrong while liking the comment");     
//     }

//     return res
//     .status(200)
//     .json(
//         new ApiResponse(
//             200,
//             {liked: true},
//             "Comment liked successfully"
//         )
//     )

// })

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: req.user._id
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline:[
                    {
                       $lookup:{
                         from: "users",
                         localField: "owner",
                         foreignField: "_id",
                         as: "ownerDetails"
                       }
                    },
                    {
                        $unwind: "$ownerDetails"
                    },
                    {
                        $project:{
                            title: 1,
                            views:1,
                            "videoFile.url": 1,
                            "thumbnail.url": 1,
                            "ownerDetails.username": 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$videoDetails"
        },
        {
            $project: {
                videoId: "$videoDetails._id",
                title: "$videoDetails.title",
                thumbnail: "$videoDetails.thumbnail.url",
                videoUrl: "$videoDetails.videoFile.url",
                views: "$videoDetails.views",
                ownerUsername:  "$videoDetails.ownerDetails.username",
                likedAt: "$createdAt" 
            }
        }
    ])
   
    if(!likedVideos){
        throw new ApiError(500, "Something went wrong while fetching liked videos");    
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
              likedVideos
            },
            "All liked video fetched successfully"
        )
    )
    
})

export {
    toggleVideoLike,
    getLikedVideos
}

