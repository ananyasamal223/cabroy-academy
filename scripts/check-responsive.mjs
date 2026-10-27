import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import http from 'node:http';
const out = path.resolve('responsive-checks');
fs.mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const staticServer=http.createServer((req,res)=>{let file=path.join(process.cwd(),'dist',decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.resolve('dist/index.html');const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp'}[path.extname(file)]||'application/octet-stream';res.setHeader('Content-Type',type);res.end(fs.readFileSync(file));});
staticServer.listen(5178,'127.0.0.1');
const vite={kill:()=>staticServer.close()};
const profile=path.join(out,'browser-profile-'+Date.now());
fs.mkdirSync(profile,{recursive:true});
const browserLog=fs.openSync(path.join(out,'browser-startup.log'),'w');
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--no-proxy-server','--disable-extensions','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:['ignore',browserLog,browserLog]});
let socket,role='student',nextId=0,bootId;
let browserPort;
const pending=new Map(),errors=[];
const course={_id:'507f1f77bcf86cd799439011',title:'Digital Marketing and Analytics Masterclass',slug:'marketing',price:4999,originalPrice:9999,thumbnail:'/digital-marketing-course.jpg',description:'Learn practical marketing, analytics and project skills.',shortDescription:'Build real marketing skills.',instructor:{_id:'507f1f77bcf86cd799439012',name:'Experienced Instructor',email:'mentor@example.test'},isPublished:true,category:'Marketing',curriculum:[{title:'Marketing fundamentals',submodules:['Introduction','Planning']}],skills:['Marketing','Analytics'],accessOptions:['individual'],tags:[],rating:4.8,durationMinutes:600};
const user=()=>({_id:'507f1f77bcf86cd799439013',id:'507f1f77bcf86cd799439013',name:'Student With A Long Display Name',email:'long.student.email.address@example.test',role,phone:'9876543210',isActive:true,adminAccess:true,adminPermissions:['reports','instructors','dashboard','revenue','courses','employees','certificates','instructor_portal'],emailVerified:true});
const fixture=url=>{
 const p=new URL(url).pathname.replace(/^\/api/,'');
 if(p==='/auth/me')return{user:user()};
 if(p==='/users/me/settings')return{account:user(),preferences:{emailNotifications:true,courseUpdates:true,assignmentReminders:true,mentorSessionReminders:true,communityUpdates:false}};
 if(p==='/admin/notifications')return{notifications:[{id:'507f1f77bcf86cd799439015',type:'mentor',title:'Mentor session requested',message:'A student requested a mentor session for their course.',link:'/admin/instructors/507f1f77bcf86cd799439012?tab=sessions',createdAt:new Date().toISOString(),read:false}],unreadCount:1};
 if(p==='/courses')return{courses:[course],total:1};
 if(p==='/courses/'+course._id)return{course};
 if(p==='/enrollments/me')return{enrollments:[{_id:'507f1f77bcf86cd799439014',course,progress:40,status:'active',mentor:course.instructor}]};
 if(p.includes('/instructors/')&&!p.endsWith('status'))return{instructor:{...course.instructor,status:'active'},profile:{...course.instructor,status:'active'},summary:{},students:[],sessions:[],projects:[],courses:[course]};
 return{stats:{},summary:{},growth:[],revenue:[],series:[],topCourses:[],subscriptions:[],rows:[],students:[],users:[],courses:[],instructors:[],mentors:[],employees:[],certificates:[],enrollments:[],projects:[],sessions:[],availability:[],announcements:[],feedbacks:[],feedback:[],reviews:[],plans:[],payments:[],salesPeople:[],totals:{},pagination:{total:0,pages:1,page:1},updatedAt:new Date().toISOString()};
};
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++nextId;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(Error('CDP timeout: '+method));}},60000).unref();});
try{
 let targets;
 for(let i=0;i<240;i++){try{const portFile=path.join(profile,'DevToolsActivePort');if(fs.existsSync(portFile)){browserPort=Number(fs.readFileSync(portFile,'utf8').split('\n')[0]);targets=await(await fetch('http://127.0.0.1:'+browserPort+'/json/list',{signal:AbortSignal.timeout(2000)})).json();if(targets.some(t=>t.type==='page'))break;}}catch{}if(chrome.exitCode!==null)throw Error('Chrome exited: '+fs.readFileSync(path.join(out,'browser-startup.log'),'utf8').slice(-1200));await sleep(500);}
 const target=targets?.find(t=>t.type==='page');if(!target)throw Error('Headless Chrome did not start');
 socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 socket.onmessage=async event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}return;}
  if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);
  if(m.method==='Fetch.requestPaused'){const {requestId,request}=m.params;try{await send('Fetch.fulfillRequest',{requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:'http://127.0.0.1:5178'},{name:'Access-Control-Allow-Headers',value:'authorization,content-type'},{name:'Access-Control-Allow-Methods',value:'GET,POST,PUT,PATCH,DELETE,OPTIONS'}],body:Buffer.from(JSON.stringify(fixture(request.url))).toString('base64')});}catch(e){errors.push(e.message);}}
 };
 await send('Page.enable');await send('Runtime.enable');await send('Fetch.enable',{patterns:[{urlPattern:'*://*/api/*'}]});
 for(let i=0;i<90;i++){try{if((await fetch('http://127.0.0.1:5178')).ok)break;}catch{}await sleep(1000);}
 const defaultRoutes=['/','/landing','/courses','/courses/'+course._id,'/about','/plans','/plans/pro','/login','/signup','/cart','/terms','/privacy','/payment-success','/payment-failed','/dashboard','/my-courses','/projects','/community','/certificates','/profile','/settings','/course-journey/'+course._id,'/assignment/'+course._id,'/checkout/'+course._id,'/plans/pro/checkout','/admin','/admin/user-overview','/admin/courses','/admin/employees','/admin/revenue','/admin/course-insights','/admin/subscriptions','/admin/instructors','/admin/instructors/507f1f77bcf86cd799439012','/admin/certificates','/admin/feedback','/admin/profile','/admin/sales','/admin/instructor-dashboard','/missing-page'];
 const routes=process.env.RESPONSIVE_ROUTES?.split(',')||defaultRoutes;
 const results=[];
 const widths=process.env.RESPONSIVE_WIDTHS?.split(',').map(Number)||[320,390,768,1024,1440];
 for(const width of widths){await send('Emulation.setDeviceMetricsOverride',{width,height:width<600?760:900,deviceScaleFactor:1,mobile:false});
  for(const route of routes){role=route.startsWith('/admin')?'admin':'student';errors.length=0;if(bootId)await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:bootId});const guest=['/login','/signup'].includes(route);const boot=await send('Page.addScriptToEvaluateOnNewDocument',{source:guest?"localStorage.removeItem('rathi-token');localStorage.removeItem('rathi-user');":"localStorage.setItem('rathi-token','responsive-test');localStorage.setItem('rathi-user',"+JSON.stringify(JSON.stringify(user()))+");"});bootId=boot.identifier;const navigation=await send('Page.navigate',{url:'http://127.0.0.1:5178'+route});if(navigation.errorText)throw Error(navigation.errorText);for(let attempt=0;attempt<60;attempt++){const ready=await send('Runtime.evaluate',{returnByValue:true,expression:"!!document.querySelector('#root')?.textContent.trim()"});if(ready.result.value)break;await sleep(150);}await sleep(500);
   const measured=await send('Runtime.evaluate',{returnByValue:true,expression:`(()=>{const width=innerWidth;const root=document.querySelector('#root');const bad=[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);if(!r.width||!r.height||s.position==='absolute'||s.position==='fixed'||s.visibility==='hidden')return false;let p=e.parentElement;while(p&&p!==document.body){if(['auto','scroll','hidden','clip'].includes(getComputedStyle(p).overflowX))return false;p=p.parentElement;}return r.right>width+2||r.left<-2;}).slice(0,8).map(e=>({tag:e.tagName,class:e.className,text:e.textContent.slice(0,65)}));return{url:location.pathname,bodyWidth:document.documentElement.scrollWidth,viewport:width,rendered:!!root?.textContent.trim(),overflow:bad};})()`});
   const result={route,width,...measured.result.value,errors:[...errors]};results.push(result);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));console.log('Checked '+width+' '+route);if(result.overflow?.length||result.errors.length||!result.rendered)console.log(JSON.stringify(result));
   if(width===390&&['/','/dashboard','/settings','/admin','/admin/instructors','/login','/signup'].includes(route)){const screenshot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,route.replaceAll('/','_')||'home')+'.png',Buffer.from(screenshot.data,'base64'));}
  }
  console.log('Checked width '+width);
 }
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));console.log('Checked '+results.length+' route/viewport combinations; fixtures used, no real account changes.');
 console.log('RESULTS '+JSON.stringify({total:results.length,rendered:results.filter(r=>r.rendered).length,errors:results.filter(r=>r.errors.length).length,overflow:results.filter(r=>r.overflow.length).length}));
 await send('Browser.close');
}finally{socket?.close();vite.kill();chrome.kill();}



