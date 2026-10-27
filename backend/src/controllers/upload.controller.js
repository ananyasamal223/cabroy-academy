export async function uploadFile(req,res){
  if(!req.file) return res.status(400).json({message:"No file uploaded"});
  res.status(201).json({
    message:"File uploaded",
    file:{
      filename:req.file.filename,
      url:`/uploads/${req.file.filename}`,
      mimetype:req.file.mimetype,
      size:req.file.size
    }
  });
}
