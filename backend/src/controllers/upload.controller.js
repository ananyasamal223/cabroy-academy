import { usesGridFS, storeUpload } from "../utils/uploadStorage.js";
export async function uploadFile(req,res){
  if(!req.file) return res.status(400).json({message:"No file uploaded"});
  const filename = usesGridFS() ? await storeUpload(req.file) : req.file.filename;
  res.status(201).json({
    message:"File uploaded",
    file:{
      filename:filename,
      url:`/uploads/${filename}`,
      mimetype:req.file.mimetype,
      size:req.file.size
    }
  });
}
