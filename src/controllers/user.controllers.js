import { asynchandeler } from "../utils/asynchandeler.js";

const registerUser = asynchandeler( async (req, res) => {
    res.status(200).json({
        message: "chai aur code"
    })
} )

export { registerUser }