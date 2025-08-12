import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";


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

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
 };