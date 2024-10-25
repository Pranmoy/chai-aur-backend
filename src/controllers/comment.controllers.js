import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
// import paginate from 'mongoose-aggregate-paginate-v2'

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
   const comments = await Comment.find({videoId}).skip((page-1)*Number(limit)).limit(Number(limit));
   if(!comments){
    throw new ApiError(400,"no comments are here")
   }

   return res
   .status(200)
   .json(new ApiResponse(200, {message: "comments are printed", comments}))
  
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }