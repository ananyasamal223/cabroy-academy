import { usesGridFS } from "../utils/uploadStorage.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir=path.resolve("uploads");
fs.mkdirSync(uploadDir,{recursive:true});

const storage=multer.diskStorage({
  destination:(req,file,cb)=>cb(null,uploadDir),
  filename:(req,file,cb)=>{
    const ext=path.extname(file.originalname);
    const base=path.basename(file.originalname,ext).replace(/[^a-z0-9-_]/gi,"-");
    cb(null,`${Date.now()}-${base}${ext}`);
  }
});

export const upload=multer({
  storage: usesGridFS() ? multer.memoryStorage() : storage,
  limits:{fileSize:25*1024*1024}
});
