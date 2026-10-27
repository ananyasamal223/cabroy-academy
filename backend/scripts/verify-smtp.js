import "dotenv/config";
import nodemailer from "nodemailer";
if (!process.env.SMTP_HOST || !process.env.SMTP_FROM || (process.env.SMTP_HOST === "smtp.gmail.com" && (!process.env.SMTP_USER || !process.env.SMTP_PASS))) {
 console.error("Configure the sending address and app password in backend/.env first. Run scripts/configure-smtp.ps1 to configure Gmail."); process.exitCode=1;
} else {
 const transport=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:Number(process.env.SMTP_PORT)===465,connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000,...(process.env.SMTP_USER?{auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}}:{})});
 try{await transport.verify();console.log("SMTP connection and credentials verified. No email was sent.");}
 catch(error){console.error("SMTP verification failed:",error.code||"CONNECTION_ERROR");process.exitCode=1;}
 finally{transport.close();}
}
