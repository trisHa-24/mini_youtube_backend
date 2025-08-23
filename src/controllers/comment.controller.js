import mongoose, {isValidObjectId} from "mongoose";
import {Comment} from "../models/comment.model.js";
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";

const addComment = asyncHandler( async (req, res) => {
    const {content} = req.body
    const {videoId} = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video Id")
    }

    if(content.trim() === ""){
        throw new ApiError(400, "Comment is required")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video does not exist")
    }

    const addVideoComment = await Comment.create({
        content: content.trim(),
        video: video._id,
        owner: req.user?._id
    })

    if(!addVideoComment){
        throw new ApiError(500, "Something went wrong while commenting")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
           {addVideoComment},
           "Comment added successfully"
        )
    )

     
})

const updateComment = asyncHandler(async (req, res) => {
    const {content: newContent} = req.body
    const {commentId}= req.params
    
    if(!newContent || newContent.trim() === ""){
        throw new ApiError(400, "Comment is required")
    }
    
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment Id")
    }
    
    const comment = await Comment.findById(commentId)
    
    if(!comment){
        throw new ApiError(404, "Comment does not exist")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {$set: {content: newContent}},
        {new: true}
    )

    if(!updatedComment){
        throw new ApiError(500, "Something went wrong while updating the comment")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                comment: updatedComment.content,
                video_id: updatedComment.video
            },
            "Comment updated successfully"
        )
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId}= req.params
    
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment Id")
    }
    
    const comment = await Comment.findById(commentId)
    
    if(!comment){
        throw new ApiError(404, "Comment does not exist")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId)

    if(!deletedComment){
        throw new ApiError(500, "Something went wrong while updating the comment")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Comment deleted successfully"
        )
    )
})

export {
    addComment,
    updateComment,
    deleteComment
}