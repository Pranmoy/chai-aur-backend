import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()// Create an Express application instance.

// Use CORS middleware to allow cross-origin requests
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credential: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())



//routes
//here we have used an undefined import name, it is because we have used default in exporting user.routes.js
import userRouter from "./routes/user.routes.js"

//routes declarations
app.use("/api/v1/users", userRouter)


export { app } 