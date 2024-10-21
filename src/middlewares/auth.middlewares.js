import {asynchandeler} from '../utils/asynchandeler.js'
import {ApiError} from '../utils/ApiError.js';
import jwt from "jsonwebtoken";
import { User } from '../models/user.models.js';


export const verifyJWT = asynchandeler(async(req, res, next)=>{

    try{
        const token = req.cookies?.accessToken || req.header("Auhtorization")?.replace('Bearer', "")

        if(!token){
            throw new ApiError(401, "unathorized request")
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
            throw new ApiError(404, "Invalid access token")
        }
    
        req.user = user
        next()
    }catch(err){
      throw new ApiError(400, err?.message || "something went wrong with the token")
    }

})