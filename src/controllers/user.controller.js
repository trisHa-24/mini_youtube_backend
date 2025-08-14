import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

// TODO : controller for deleting user account

const options = {
        httpOnly: true,
        secure: true
}

let generateAccessTokenAndRefreshToken = async (user) => {

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save();
       
    return { accessToken, refreshToken };
}

const registerUser = asyncHandler(async (req, res) => {
   // read user data from user request
   // validate user data
   // check if user already exsts
   // check for images, avatar
   // upload images to cloudinary,and store avatar url 
   // create user object - create entry in db
   // check if user creation is successful
   // remove passsword and refresh token from response
    // send response with user data


    const {fullName, email, username, password} = req.body
    
    if(
        [fullName, email, username, password].some(
            (field)=> field?.trim() === "")
    ){
       throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [
            {email: email.toLowerCase()},
            {username: username.toLowerCase()},
        ]
    })

    if( existedUser ){
        throw new ApiError(409, "User already exists");
    }
    console.log(req.files);
    const avatarLocalPath = await req.files?.avatar?.[0]?.path;
    
    const coverImageLocalPath = await req.files?.coverImage?.[0]?.path; // coverImage is not mandatory for the user to put // checking for coverImage is present or not  
    
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }
   
   const avatar = await uploadOnCloudinary(avatarLocalPath); 
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);

   if(!avatar){
         throw new ApiError(500, "Avatar upload failed");
   }

   // create user object
   const user = await User.create({
       fullName,
       avatar: avatar.url,
       coverImage: coverImage?.url || "",
       email,
       password,
       username: username.toLowerCase(),
   })

   const userCreated = await User.findById(user._id).select(
         "-password -refreshToken"
   )

   if(!userCreated){
         throw new ApiError(500, "User creation failed");
   }
  
   return res.status(201).json(
         new ApiResponse(
            200,
            userCreated,
            "User registered Successfully"
         )
   )
    
});

const loginUser = asyncHandler(async (req, res) => {
    // read req nody 
    // validate user email or username 
    // find if user exists
    // check if passwork is correct
    // generate access token and refresh token
    //send cookie &  update user refresh token in db

    const {email, username, password} = req.body

    if(!(username || email)){
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid credentials");
    }
    
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user)

    const LoggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { 
                    user: LoggedInUser, accessToken, refreshToken
                },
                "User logged in successfully"
            )
        )

    
})

const logoutUser = asyncHandler(async (req, res) => {
    // clear cookies
    // update user refresh token in db
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
       { 
          new: true
       }
    )
    
    return res 
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json( new ApiResponse(200, {}, "User logged out successfully"))

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    //get refresh token from cookies
    // verify refresh token 
    // generate new access token as well as refresh token
    // update user refresh token in db

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }

    const decodedRefreshToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )
    
    const user = await User.findById(decodedRefreshToken?._id)

    if(!user){
        throw new ApiError(404, "Invalid refresh token")
    }

    if(incomingRefreshToken !== user?.refreshToken ){
        throw new ApiError(401, "refresh token expired or used")
    }
    
    const {accessToken: newAccessToken, refreshToken: newRefreshToken} = await generateAccessTokenAndRefreshToken(user)  

    return res
    .status(200)
    .cookie("accessToken", newAccessToken, options)
    .cookie("refreshToken", newAccessToken, options)
    .json(
        new ApiResponse(
            200,
            {accessToken: newAccessToken, refreshToken: newRefreshToken},
            "Access token refreshed successfully"
        )
    )
    

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    // I will take old and new password from user
    // from user object , get current password 
    // validate if old and cuurrent password are same 
    // if yes then update user pass
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    if(!user){
        throw new ApiError(404, "Unauthorized request")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(401, "Old password is incorrect")
    }

    if(oldPassword === newPassword){
        throw new ApiError(400, "New password cannot be same as old password")
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: true});

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Password changed successfully"
        )
    )

})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            req.user,
            "Current user fetched successfully"
        )
    )
})

const updateAccountDetails = asyncHandler( async (req, res) =>{
    // get user details from req body both fullName and email are required
    const {fullName, email} = req.body;

    if(!fullName || !email){
        throw new ApiError(400, "Full name and email are required");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email.toLowerCase()
            }
        },
        {new: true}
    ).select("-password -refreshToken");
    
    if (!user) {
      throw new ApiError(404, "User not found");
   }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "User details updated successfully"
        )
    )
})

const updateUserAvatar = asyncHandler(async (req, res) =>{
    const avatarLocalPath = await req.file?.path;
   

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    

    if(!avatar.url){
        throw new ApiError(500, "Error on uploading avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password -refreshToken");

    if(!user){
        throw new ApiError(404, "User not found")
    }
    // TODO : delete old avatar from cloudinary
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "User avatar updated successfully"
        )
    )
})

const updateUserCoverImage = asyncHandler(async (req, res) =>{
    const coverImageLocalPath = await req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover Image file is required");
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage.url){
        throw new ApiError(500, "Error on uploading cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password -refreshToken");

    if(!user){
        throw new ApiError(404, "User not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "User Cover Image updated successfully"
        )
    )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400, "Username is required");
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount: { $size: "$subscribers" },
                channelsSubscribedToCount: { $size: "$subscribedTo" },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.users?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1
            }
        }
        
    ])

    if(!channel?.length){
        throw new ApiError(404, "Channel does not exist");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            channel[0],
            "User channel profile fetched successfully"
        )
    )
})

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile
 };