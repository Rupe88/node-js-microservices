const mongoose=require("mongoose");
const searchPostSchema=new mongoose.Schema({
    postId:{
        type:String,
        required:true,
        unique:true
    },

    userId:{
        type:String,
        required:true,
        unique:true
    },
    content:{
        type:String,
        required:true,
    },
    createdAt:{
        type:Date,
        required:true
    }
}, {timestamps:true})


searchPostSchema.index({content:'text'})
searchPostSchema.index({createdAt:-1})


const SearchPost=mongoose.model("Search", searchPostSchema);
module.exports=SearchPost