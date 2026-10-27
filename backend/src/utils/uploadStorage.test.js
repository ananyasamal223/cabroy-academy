import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import express from "express";
import { randomUUID } from "node:crypto";
import { storeUpload, serveUpload, uploadBucket } from "./uploadStorage.js";

test("MongoDB uploads persist and support byte ranges without local disk", {skip:process.env.UPLOAD_INTEGRATION !== "1",timeout:20000},async()=>{
 const name="cabroy_upload_test_"+randomUUID().replaceAll("-","");
 const previous=process.env.UPLOAD_STORAGE;let server;
 try {
  await mongoose.connect("mongodb://127.0.0.1:27017",{dbName:name,serverSelectionTimeoutMS:3000});
  process.env.UPLOAD_STORAGE="gridfs";
  const bytes=Buffer.from("persistent upload bytes");
  const filename=await storeUpload({originalname:"sample.txt",mimetype:"text/plain",buffer:bytes});
  assert.equal((await uploadBucket().find({filename}).next()).length,bytes.length);
  const app=express();app.get("/uploads/:filename",serveUpload);app.use((req,res)=>res.status(404).end());
  server=app.listen(0,"127.0.0.1");await new Promise(resolve=>server.once("listening",resolve));
  const url=`http://127.0.0.1:${server.address().port}/uploads/${filename}`;
  const full=await fetch(url);assert.equal(await full.text(),bytes.toString());assert.match(full.headers.get("content-disposition"),/attachment/);
  const part=await fetch(url,{headers:{Range:"bytes=2-6"}});assert.equal(part.status,206);assert.equal(await part.text(),bytes.subarray(2,7).toString());
  const invalid=await fetch(url,{headers:{Range:"bytes=999-"}});assert.equal(invalid.status,416);
  const head=await fetch(url,{method:"HEAD"});assert.equal(head.headers.get("content-length"),String(bytes.length));assert.equal(await head.text(),"");
  assert.equal((await fetch(url+"missing")).status,404);
 } finally {
  if(server)await new Promise(resolve=>server.close(resolve));
  if(mongoose.connection.name===name && /^cabroy_upload_test_[a-f0-9]+$/.test(name))await mongoose.connection.dropDatabase();
  await mongoose.disconnect();if(previous===undefined)delete process.env.UPLOAD_STORAGE;else process.env.UPLOAD_STORAGE=previous;
 }
});
