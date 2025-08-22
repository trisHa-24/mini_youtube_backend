import mongoose, { isValidObjectId } from "mongoose";
import {Playlist} from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler( async (req, res) => {
   const { name, description } = req.body

   if(name.trim() === ""){
     throw new ApiError(400, "Name is required")
   }

   const existPlaylist = await Playlist.findOne(
      {
        name: name.toLowerCase().trim(),
        owner: req.user._id
      }
    )

    if(existPlaylist){
        throw new ApiError(409, "Playlist already exist")
    }

    const playlist = await Playlist.create(
        {
            name,
            description: description?.trim() || "",
            owner: req.user._id
        }
    )

    if(!playlist){
        throw new ApiError(500, "Something went wrong while creating the playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                playlist
            },
            "Playlist created successfully"
        )
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user Id")
    }

    const userIdExist = await User.findById(userId)

    if(!userIdExist){
        throw new ApiError(404, "UserId does not exist")
    }

    const playlists = await Playlist.find(
        {
            owner: userId
        }
    )

    if(playlists.length === 0){
        return res
       .status(200)
       .json(
          new ApiResponse(
            200,
            {playlists: []},
            "User don't have any playlist"
         )
        )
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {playlists},
            "Playlists fetched successfully"
        )
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist Id")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "playlist does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {playlist},
            "Playlist fetched successfully"
        )
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "invalid playlistId or videoId")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "Playlist does not exist")
    }

    if(playlist.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "you are not authorized to add video in this playlist")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "video does not exist")
    }

    if(playlist.videos.includes(videoId)){
        throw new ApiError(409, "Video already exist in this playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {$push: {videos: videoId}},
        {new : true}
    )

    if(!updatedPlaylist){
        throw new ApiError(500, "Something went wrong while adding the video")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {updatedPlaylist},
            "Video added to the playlist successfully"
        )
    )

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid playlistId or videoId")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "Playlist does not exist")
    }

    if(playlist.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "you are not authorized to remove video from this playlist")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video does not exist")
    }

    if(!playlist.videos.some(v_id => v_id.equals(videoId))){
        throw new ApiError(400, "Video not found in this playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {$pull: {videos: videoId}},
        {new : true}
    )

    if(!updatedPlaylist){
        throw new ApiError(500, "Something went wrong while removing the video")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {updatedPlaylist},
            "Video removed from the playlist successfully "
        )
    )
    
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist Id")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "playlist does not exist")
    }

    if(playlist.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "You are not authorized to delete this playlist")
    }

    const deletePlaylist = await Playlist.findByIdAndDelete(playlistId)

    if(!deletePlaylist){
        throw new ApiError(500, "Something went wrong while deleting the playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {deleted: true},
            "Playlist deleted successfully"
        )
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid PlaylistId")
    }

    if(name.trim() === ""){
        throw new ApiError(409, "playlist name is required")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "Playlist does not exist")
    }
    console.log(req.body._id);
    
    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "not authorized to update this playlist")
    }

    const updateData = { name };
    if (description !== undefined) updateData.description = description.toLowerCase();

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        updateData,
        {new: true}
    )
    
    if(!updatedPlaylist){
        throw new ApiError(500, "something went wrong while updating")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {updatedPlaylist},
            "Playlist updated successfully"
        )
    )
    
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
