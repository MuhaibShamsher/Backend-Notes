import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN }))

app.use(express.json({ limit: '25kb' }))   // the limit applied on the data sending to server
app.use(express.urlencoded({ extended: true, limit: '25kb' }))
app.use(express.static("public"))

app.use(cookieParser()) // allows to perform CRUD operation on user's cookies


// import routes
import userRouter from "./routes/user.routes.js"

// routes
app.use("/user", userRouter)

export { app }