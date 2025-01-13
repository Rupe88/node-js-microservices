const epxress=require("express");
const { createPost } = require("../controller/postController");
const authenticateRequest = require("../middleware/authMiddleware");


const router=epxress.Router();





router.use(authenticateRequest)

router.post("/create-post", createPost)
module.exports=router