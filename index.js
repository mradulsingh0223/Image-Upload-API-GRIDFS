const express =require("express");
const app = express();
const mongoose = require("mongoose");
const multer = require("multer");
const {
    GridFsStorage
} =  require("multer-gridfs-storage");
const crypto =require('crypto');
var path= require('path');
const { rejects } = require("assert");

require("dotenv").config();

const mongouri =process.env.URI;
try{
    mongoose.connect(mongouri, {
        useUnifiedTopology: true,
        useNewUrlParser: true
    });
}
catch(error){
    console.log(error);
    handleError(error);
}

process.on('unhandledRejection', error =>{
    console.log('unhandledRejection', error.message);
});


//check Connection and creating bucket
 let bucket;
mongoose.connection.on("connected", ()=>{
    console.log("Db Connected");
    var client = mongoose.connections[0].client;
    var db= mongoose.connections[0].db;
    bucket= new mongoose.mongo.GridFSBucket(db,{
        bucketName: "newBucket"
    })
    // console.log(bucket)
})

app.use(express.json());
app.use(express.urlencoded({
    extended: false
}))
const storage = new GridFsStorage({
    url: mongouri,
    file: (req, file) =>{
        return new Promise((resolve, reject) =>{
            const filename= file.orignalname;
            const fileInfo = {
                filename: filename,
                bucketName: "newBucket"
            };
            resolve(fileInfo);
        });
    }
});
const upload = multer({
    storage
});

app.get("/fileinfo/:filename", (req,res) =>{
    const file= bucket.find({
        filename: req.params.filename
    })
    .toArray((err, files)=>{
        if(!files || files.length ===0)
        {
            return res.status(404)
            .json({
                err: "no files exist"
            });
        }
       /* res.status(200).json({
            success: true,
            file: files[0],
        })
        */
       const stream= bucket.openDownloadStreamByName(req.params.filename)
       stream.on('data', (chunk) => {
        res.write(chunk); 
      });
  
      stream.on('error', (err) => {
        console.error(err);
        res.status(500).end();
      });
  
      stream.on('end', () => {
        res.end();
      });
    });
});


app.post("/upload", upload.single("file"), (req, res) =>{
    res.status(200)
    .send("File Uploaded Successfully");
})
app.listen(process.env.PORT, function(){
    console.log('App live on localhost:' + process.env.PORT);
})