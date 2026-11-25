import Contact from "../models/Contact.js";
import { createRoutedLeads } from "../utils/crmRouting.js";
export async function createContact(req,res){
  const { name, email, phone, subject, message, campaignSource } = req.body;
  if (typeof email !== "string" || !email.trim()) return res.status(400).json({ message: "Email is required." });
  const course = typeof subject === "string" ? /^(?:Counselling enquiry|Brochure request):\s*(.+)/i.exec(subject)?.[1].slice(0, 160) : undefined;
  const source = campaignSource === "google" ? "Google Ads" : campaignSource === "meta" ? "Meta Ads" : "Website";
  const [contact] = await createRoutedLeads([{ name, email, phone, subject, message, source, course }]);
  const { teamId, ...publicContact } = contact.toObject();
  res.status(201).json({message:"Message received",contact:publicContact});
}
export async function listContacts(req,res){
  res.json({contacts:await Contact.find().sort({createdAt:-1})});
}
export async function updateContact(req,res){
  const contact=await Contact.findByIdAndUpdate(req.params.id,{$set:{status:req.body.status}},{new:true});
  if(!contact) return res.status(404).json({message:"Contact not found"});
  res.json({contact});
}
