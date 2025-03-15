const mongoose = require('mongoose');
require('dotenv').config();
const mongo_uri = process.env.mongo_uri;

const connectDB = async() =>{
    try{
          
        await mongoose.connect(mongo_uri);
        console.log("MongoDB Connected");
    }catch(err){
        console.log(`MongoDB Connection Failed: ${err}`);
        process.exit(1);
    }
}

module.exports = connectDB;