import { asynchandeler } from "../utils/asynchandeler.js";
import { ApiError } from "../utils/ApiError.js"
import { User} from "../models/user.models.js"
//user is created through mongoDB, so it can directly talk to the database
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const generateAccesAndRefreshToken = async(userId)=>{
  try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return {
           refreshToken,
           accessToken
        }

  }catch(error){
    throw new ApiError(500, "somthing went wrong while genretation token")
  }
}

const registerUser = asynchandeler( async (req, res) => {
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
    const {fullname, username, email, password} = req.body 
      console.log(fullname, email);

      /*if( fullname === ""){
        throw new ApiError(400, "fullname is required")
      }*/

        /*if([fullname. username, email, password] === ""){
          throw new ApiError(400, "some fields are required to fill")
        }// dumb code beaucse we are comparing an array with a fucking string
      */
        if ([fullname, username, email, password].some((field)=>{
          field?.trim() === ""
        })) {
          throw new ApiError(400, "Some fields are required to fill");
      }//The some() method tests whether any of the array elements pass the given test function.
 
      const existedUser = await User.findOne({
        $or : [{username}, {email}]
      })

      if (existedUser){
        throw new ApiError(409, "User with email or username already exist")
      }

      const avatarLocalPath = req.files?.avatar[0]?.path;

      
      // const coverImageLocalPath = req.files?.coverImage[0]?.path;
      let coverImageLocalPath;
      if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
      }
    
      if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
      }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
      throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
      fullname,
      username: username.toLowerCase(),
      email,
      password,
      avatar: avatar.url,
      coverImage: coverImage?.url || ""
    })
     
    const createdUser = await User.findById(user._id).select(
      "-password -refershToken"
    )
    if(!createdUser){
      throw new ApiError(500, "something went wrong while rejestering an user")
    }

    return res.status(201).json(
      new ApiResponse(200, createdUser, "User registered successfully")
    )

} )

const loginUser = asynchandeler(async (req, res) =>{
      // req body -> data
      //username or email
      //find the user
      //password check
      //access and refresh token
      //send cookie

      const {email, username, password} = req.body;

      if(!username || !email){
        throw new ApiError(400, "username or email is required")
      }

      const user = await User.findOne({
        $or: [{email, username}]
      })
      if(!user){
        throw new ApiError(400, "no user found")
      }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
      throw new ApiError(400, "Invalid user credentials")
    }
    
   const {refreshToken, accessToken} = await generateAccesAndRefreshToken(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
   

  const options = {
    httpOnly : true,
    secure: true
  }

  return res
  .status(200)
  .cookie('accessToken', accessToken, options)
  .cookie('refreshToken', refreshToken, options)
  .json(
    new ApiResponse(200, 
      {
        user: loggedInUser, accessToken,
        message: "Logged in successfully"
      }
    )
  )

})

const logoutUser = asynchandeler(async (req, res) => {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          refreshToken: undefined
        }
      },
      {new: true}
    )

    const options = {
      httpOnly : true,
      secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"))
  
})

export { registerUser, loginUser, logoutUser }