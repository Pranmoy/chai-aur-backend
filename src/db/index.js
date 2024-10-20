import mongoose from "mongoose"
import {DB_NAME} from "../constants.js";

const connectDB = async () =>{
    try{
       const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       console.log(`\n mongooDB connected !! FB HOST : ${connectionInstance.connection.host}`)
    }catch(error){
        console.log("mongoDB connection FAILED:" + error)
        process.exit(1)
    }

}

export default connectDB