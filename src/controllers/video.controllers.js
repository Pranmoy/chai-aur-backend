import { asynchandeler } from "../utils/asynchandeler";
import {uploadOnCloudinary} from "../utils/cloudinary.js"

const getAllVideos = asynchandeler(async (req, res) => {
  
    const {page =1, limit =10, quer, sortBy, sortType,userId} = req.query
    //todo: get all videos bbased on query, sort, pagination
})

const publishVideo = asynchandeler(async(req, res)=>{
    const {title , description} = req.body
    //todo: get video, upload to cloudinary, create, video

})

const getVideoById = asynchandeler(async(req, res)=>{
    const {videoId} = req.params
    //todo: update video by Id
})

const updateVideo = asynchandeler(async(req, res)=>{
    const {videoId} = req.params
    //todo: update video detalis like title, description, thumbnail
})

const deleteVideo = asynchandeler(async(req, res)=>{
    const {videoId} = req.params
    //todo: delete video
})

const togglePublishStatus = asynchandeler(async(req, res)=>{
    const {videoId} = req.pramas
    
})

export{
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
