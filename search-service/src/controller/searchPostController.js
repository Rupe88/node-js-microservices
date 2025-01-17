const logger = require("../utils/logger")



const searchPostController=async(req, res)=>{
    logger.info("Search Post Controlller Hitt...")
    try {

        console.log("hahah")
        
    } catch (error) {
        logger.error("Error Occur in Search Post Controller")
        
    }
}


module.exports={searchPostController}