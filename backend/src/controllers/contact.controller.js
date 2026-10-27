import Contact from "../models/Contact.js";
export async function createContact(req,res){
  const contact=await Contact.create(req.body);
  res.status(201).json({message:"Message received",contact});
}
export async function listContacts(req,res){
  res.json({contacts:await Contact.find().sort({createdAt:-1})});
}
export async function updateContact(req,res){
  const contact=await Contact.findByIdAndUpdate(req.params.id,{$set:{status:req.body.status}},{new:true});
  if(!contact) return res.status(404).json({message:"Contact not found"});
  res.json({contact});
}
