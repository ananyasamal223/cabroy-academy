import mongoose from "mongoose";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

export const usesGridFS = () => process.env.UPLOAD_STORAGE === "gridfs";
export function uploadBucket() {
  if (!mongoose.connection.db) throw new Error("Upload database is not connected.");
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "uploads" });
}
export async function storeUpload(file) {
  const filename = `${randomUUID()}${path.extname(file.originalname).replace(/[^.a-z0-9]/gi, "").slice(0, 16)}`;
  const stream = uploadBucket().openUploadStream(filename, { metadata: { contentType: file.mimetype } });
  try {
    await pipeline(Readable.from(file.buffer), stream);
  } catch (error) {
    await stream.abort().catch(() => {});
    throw error;
  }
  return filename;
}
export async function serveUpload(req, res, next) {
  if (!usesGridFS()) return next();
  const bucket = uploadBucket();
  const file = await bucket.find({ filename: req.params.filename }).limit(1).next();
  if (!file) return next();
  const type = file.metadata?.contentType || "application/octet-stream";
  // Keep arbitrary HTML/SVG uploads from executing in the API origin.
  const inline = /^(image\/(png|jpeg|webp|gif|avif)|video\/(mp4|webm)|audio\/(mpeg|ogg|wav)|application\/pdf)$/.test(type);
  res.setHeader("Content-Type", inline ? type : "application/octet-stream");
  res.setHeader("Content-Disposition", `${inline ? "inline" : "attachment"}; filename="${file.filename}"`);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Accept-Ranges", "bytes");
  let start = 0, end = file.length;
  if (req.headers.range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if (!match || (!match[1] && !match[2])) return res.status(416).set("Content-Range", `bytes */${file.length}`).end();
    if (!match[1]) start = Math.max(0, end - Number(match[2]));
    else { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2]) + 1); }
    if (start >= end || !Number.isSafeInteger(start) || !Number.isSafeInteger(end)) return res.status(416).set("Content-Range", `bytes */${file.length}`).end();
    res.status(206).set("Content-Range", `bytes ${start}-${end-1}/${file.length}`);
  }
  res.setHeader("Content-Length", end - start);
  if (req.method === "HEAD") return res.end();
  const download = bucket.openDownloadStream(file._id, { start, end });
  res.on("close", () => download.destroy());
  download.on("error", error => { if (!res.headersSent) next(error); else res.destroy(error); });
  download.pipe(res);
}
