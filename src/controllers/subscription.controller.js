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

export {
    toggleSubscription
}