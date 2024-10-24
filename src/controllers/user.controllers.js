import { asynchandeler } from "../utils/asynchandeler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
//user is created through mongoDB, so it can directly talk to the database
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { response } from "express";

const generateAccesAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return {
      refreshToken,
      accessToken,
    };
  } catch (error) {
    throw new ApiError(500, "somthing went wrong while genretation token");
  }
};

const registerUser = asynchandeler(async (req, res) => {
  // get user details from frontend
  // validetaion - not empty
  // check if user already exists: username, email
  // check for image, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove passwords and refersh token field from reponse
  // check for user creation
  // return response

  //we get the frontend data( from json data or form data) in req.body
  const { fullname, username, email, password } = req.body;
  console.log(fullname, email);

  /*if( fullname === ""){
        throw new ApiError(400, "fullname is required")
      }*/

  /*if([fullname. username, email, password] === ""){
          throw new ApiError(400, "some fields are required to fill")
        }// dumb code beaucse we are comparing an array with a fucking string
      */
  if (
    [fullname, username, email, password].some((field) => {
      field?.trim() === "";
    })
  ) {
    throw new ApiError(400, "Some fields are required to fill");
  } //The some() method tests whether any of the array elements pass the given test function.

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exist");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;

  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullname,
    username: username.toLowerCase(),
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refershToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "something went wrong while rejestering an user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asynchandeler(async (req, res) => {
  // req body -> data
  //username or email
  //find the user
  //password check
  //access and refresh token
  //send cookie

  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  } //if you want both

  // if(!(username || email)){
  //   throw new ApiError(400, "username or email is required")
  // }

  const user = await User.findOne({
    $or: [{ email, username }],
  });
  if (!user) {
    throw new ApiError(400, "no user found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid user credentials");
  }

  const { refreshToken, accessToken } = await generateAccesAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, {
        user: loggedInUser,
        accessToken,
        message: "Logged in successfully",
      })
    );
});

const logoutUser = asynchandeler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

const refreshAccessToken = asynchandeler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError("401, unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError("401, invalid refreshToken");
    }

    if (incomingRefreshToken != user?.refreshToken) {
      throw new ApiError(401, "refreshToken is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } = await generateAccesAndRefreshToken(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token");
  }
});

const changeCurrentPassword = asynchandeler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invaild old password");
  }

  user.password = newPassword;
  user.save({ validateBeforeSave: false });

  return response
    .status(200)
    .json(new ApiResponse(200, {}, "password save successfuly"));
});

const getCurrentUser = asynchandeler(async (req, res) => {
  return res
    .status(200)
    .json( new ApiResponse(200, req.user, "cuurent user fetched successfuly"));
});

const updateAccountDetails = asynchandeler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!fullname && !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asynchandeler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file id missing");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar image updated"));
});

const deletingOldAvatar = asynchandeler(async (req, res) => {
  const { oldAvatar, newAvatar } = req.file?.path;

  const user = await User.findById(req.user?._id);
  const isNewAvatarCorrect = await user.isNewAvatarCorrect(oldAvatar);

  if (!isNewAvatarCorrect) {
    throw new ApiError(400, "Invaild old Avatar");
  }

  user.avatar = newAvatar;
  user.save({ validateBeforeSave: false });

  return response
    .status(200)
    .json(new ApiResponse(200, {}, "old Avatar has been deleted"));
});

const updateUserCoverImage = asynchandeler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file id missing");
  }
  const coverImage = await uploadOnCloudinary(avatatrLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on cover Image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated"));
});

const getUserChannelProfile = asynchandeler(async(req, res)=>{
  const {username} = req.params
  if(!username?.trim){
   throw new ApiError(400, "username is missing")
  }
   
   const channel = await User.aggregate([
    {
      $match:{
        username : username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscribes",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscribes",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers"
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo"
        },
        isSubscribed:{
          $cond: {
            if: {$in: [req.user?._id, "subscribers.subscriber"]},
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        email: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,

      }
    }
   ])
   console.log(channel, "channel info")

   if(!channel?.length){
    throw new ApiError(400, "channel does not exist")
   }

   return res.status(200)
   .json( new ApiResponse(200, channel[0], "User channel fetched successfully"))
})

const getWatchHistory = asynchandeler(async(req, res)=>{

  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id) 
      }
    },
    {
      $lookup:{
        field: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory", 
        pipeline:[
          {
            $lookup:{
              field: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project:{
                    fullname: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first :"owner"
              }
            }
          }
        ]
      }
    }
  ])

  return res
  .status(200)
  .json( new ApiResponse(200, user[0].watchHistory,
    "watched history fetched successfully"
  ))
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
  deletingOldAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};
