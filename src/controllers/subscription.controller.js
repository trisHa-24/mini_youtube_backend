import mongoose, {isValidObjectId} from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const toggleSubscription = asyncHandler( async (req, res) => {
    // read channelId from request params and userId from req
    // check if channelId is valid or not- also check if it exist or not
    // check userId and channelId are not same
    // check already subscriber or not
    // if yes then unsubscribe and delete subscribtion
    // if no then create new subscription
    
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channelId")
    }

    const channel = await User.findById(channelId)

    if(!channel){
        throw new ApiError(404, "Channel does not exist")
    }

    if( channel?._id.toString() === req.user?._id.toString() ){  
        throw new ApiError(400, "You cannot subscribe to your own channel")
    }

    const existedSubscriber = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channel._id
    })

    if(existedSubscriber){
      await Subscription.findByIdAndDelete(existedSubscriber._id)
      return res
      .status(200)
      .json(
        new ApiResponse(
            200,
            {
               subscribed: false,
               channelId
            },
            "Unsubscribed successfully",
        )
      )
    }

    const newSubscription = await Subscription.create({
        subscriber: req.user._id,
        channel: channel._id
    })

   if(!newSubscription){
         throw new ApiError(500, "Something went wrong while subscribing");
   }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
               subscribed: true,
               channelId
            },
            "Subscribed successfully"
        )
    )
    

})

const getUserChannelSubscribers = asyncHandler( async (req, res) => {
    // get userId 
    // check if userId is valid or not and eist or not
    // get all subscriber of that userId
    // return all subscriber
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channelId")
    }

    const channel = await User.findById(channelId)

    if(!channel){
        throw new ApiError(404, "channel doesn't exist")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: channel?._id
            }
        },
        {
             $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers"
            }
        },
        { $unwind: "$subscribers" }, 
        {
            $project:{
                _id: 0,
                subscriberId: "$subscribers._id",
                username: "$subscribers.username",
                fullName: "$subscribers.fullName",
                avatar: "$subscribers.avatar",
            }
        }
    ])


    if(!subscribers || subscribers.length === 0){
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    subscribers
                },
                "No subscribers found"
            )
        )
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                subscribers
            },
            "Subscribers fetched successfully"
        )
    )
 
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {

    const { subscriberId } = req.params

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "Invalid subscriberId")
    }
    const subscriber = await User.findById(subscriberId)

    if(!subscriber){
        throw new ApiError(404, "User does not exist")
    }

    const channelsSubscribedTo = await Subscription.aggregate([
        {
            $match: {
                subscriber: subscriber?._id
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannels"
            }
        },
        { $unwind: "$subscribedChannels" }, 
        {
            $project: {
                _id: 0,
                channelId: "$subscribedChannels._id",
                username: "$subscribedChannels.username",
                fullName: "$subscribedChannels.fullName",
                avatar: "$subscribedChannels.avatar",
                coverImage: "$subscribedChannels.coverImage"
            }
        }
        
    ])

    if(!channelsSubscribedTo || channelsSubscribedTo.length === 0){
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "No channels Subscribed"
            )
        )
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                subscribedChannels: channelsSubscribedTo
            },
            "Subscribed channels fetched successfully"
        )
    )

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}