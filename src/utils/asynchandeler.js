const asynchandeler = (requestHandeler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandeler(req, res, next)).catch((err) => next(err))
    }
}

export { asynchandeler }

// const asynchandeler = () => {}
// const asynchandeler = (fn) => {() => {}}
// const asynchandeler = (fn) => async () => {}

// const asynchandeler = (fn) => async (req, res, next) => {
//     try{
//           await fn(req, res, next)
//     }catch(error){
//         res.status(err.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }