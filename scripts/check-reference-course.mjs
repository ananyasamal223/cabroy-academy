import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import http from 'node:http';
const out = path.resolve('reference-course-checks');
fs.mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const staticServer=http.createServer((req,res)=>{let file=path.join(process.cwd(),'dist',decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.resolve('dist/index.html');const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp'}[path.extname(file)]||'application/octet-stream';res.setHeader('Content-Type',type);res.end(fs.readFileSync(file));});
staticServer.listen(5182,'127.0.0.1');
const vite={kill:()=>staticServer.close()};
const profile=path.join(out,'browser-profile-'+Date.now());
fs.mkdirSync(profile,{recursive:true});
const browserLog=fs.openSync(path.join(out,'browser-startup.log'),'w');
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--no-proxy-server','--disable-extensions','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:['ignore',browserLog,browserLog]});
let socket,role='student',nextId=0,bootId;
let browserPort;
const pending=new Map(),errors=[];
const course={_id:'507f1f77bcf86cd799439011',title:'Digital Marketing Mastery',slug:'digital-marketing',price:4999,originalPrice:7999,description:'Build a practical understanding of marketing, from finding your audience to measuring the impact of your campaigns.',shortDescription:'Learn SEO, social media, paid advertising and analytics through a clear practical learning path.',instructor:{_id:'507f1f77bcf86cd799439012',name:'Course Learning Team',bio:'Guidance and resources for your marketing learning journey.'},isPublished:true,category:'Digital Marketing',curriculum:['Marketing Foundations','Audience Research','SEO Fundamentals','Content & Social Media','Google Ads','Analytics & Reporting'].map(title=>({title,submodules:['Core concepts and principles','Guided learning activity','Putting the topic into practice']})),skills:['SEO','Google Ads','Social Media','Google Analytics'],projects:[{title:'Audience & Campaign Brief',problemStatement:'Explore audience needs and bring your campaign ideas into a structured brief.'},{title:'Marketing Measurement Plan',problemStatement:'Choose the metrics that will help you understand the outcome of a campaign.'}],accessOptions:['individual'],tags:[],duration:'Self-paced',durationMinutes:600};
let purchased=true;
const user=()=>({_id:'507f1f77bcf86cd799439013',id:'507f1f77bcf86cd799439013',name:'Student With A Long Display Name',email:'long.student.email.address@example.test',role,phone:'9876543210',isActive:true,adminAccess:true,adminPermissions:['reports','instructors','dashboard','revenue','courses','employees','certificates','instructor_portal'],emailVerified:true});
const fixture=url=>{
 const p=new URL(url).pathname.replace(/^\/api/,'');
 if(p==='/auth/me')return{user:user()};
 if(p==='/users/me/settings')return{account:user(),preferences:{emailNotifications:true,courseUpdates:true,assignmentReminders:true,mentorSessionReminders:true,communityUpdates:false}};
 if(p==='/admin/notifications')return{notifications:[{id:'507f1f77bcf86cd799439015',type:'mentor',title:'Mentor session requested',message:'A student requested a mentor session for their course.',link:'/admin/instructors/507f1f77bcf86cd799439012?tab=sessions',createdAt:new Date().toISOString(),read:false}],unreadCount:1};
 if(p==='/courses')return{courses:[course],total:1};
 if(p==='/courses/'+course._id)return{course};
 if(p==='/courses/'+course._id+'/materials')return{url:'https://drive.google.com/file/d/test-course/view'};
 if(p==='/enrollments/me')return{enrollments:purchased?[{_id:'507f1f77bcf86cd799439014',course,progress:40,status:'active',mentor:course.instructor}]:[]};
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
  if(m.method==='Fetch.requestPaused'){const {requestId,request}=m.params;try{await send('Fetch.fulfillRequest',{requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:'http://127.0.0.1:5182'},{name:'Access-Control-Allow-Headers',value:'authorization,content-type'},{name:'Access-Control-Allow-Methods',value:'GET,POST,PUT,PATCH,DELETE,OPTIONS'}],body:Buffer.from(JSON.stringify(fixture(request.url))).toString('base64')});}catch(e){errors.push(e.message);}}
 };
 await send('Page.enable');await send('Runtime.enable');await send('Fetch.enable',{patterns:[{urlPattern:'*://*/api/*'}]});
 for(let i=0;i<90;i++){try{if((await fetch('http://127.0.0.1:5182')).ok)break;}catch{}await sleep(1000);}
 const results=[];
 const evaluate=async expression => {const r=await send('Runtime.evaluate',{returnByValue:true,awaitPromise:true,expression});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
 const waitFor=async expression=>{for(let i=0;i<120;i++){if(await evaluate(expression))return;await sleep(100);}throw Error('Condition not reached: '+expression);};
 const capture=async(name,selector)=>{
  const clip=await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:Math.max(0,r.x+scrollX),y:Math.max(0,r.y+scrollY),width:Math.min(innerWidth,r.width),height:Math.min(1700,r.height),scale:1};})()`);
  const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip});fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(r.data,'base64'));
 };
 for(const width of [1440,1024,768,390,320]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  if(bootId)await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:bootId});
  const boot=await send('Page.addScriptToEvaluateOnNewDocument',{source:"localStorage.setItem('rathi-token','reference-test');localStorage.setItem('rathi-user',"+JSON.stringify(JSON.stringify(user()))+");"});bootId=boot.identifier;
  errors.length=0;
  await send('Page.navigate',{url:'http://127.0.0.1:5182/courses/'+course._id});
  await waitFor("!!document.querySelector('.rp-bento') && [...document.querySelectorAll('.cdr-course-hero-actions button')].some(b=>b.textContent.includes('Start Learning'))");
  await evaluate("Promise.all([...document.images].map(i=>i.complete?Promise.resolve():new Promise(r=>{i.onload=r;i.onerror=r})))");
  const before=await evaluate("({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,books:document.querySelectorAll('.rp-book').length,brokenImages:[...document.images].filter(i=>!i.naturalWidth).map(i=>i.src)})");
  await evaluate("document.querySelectorAll('.rp-book')[1].click()");await waitFor("document.querySelector('.rp-module-dialog').open");
  const dialog=await evaluate("document.querySelector('.rp-module-dialog h2').textContent");
  await evaluate("document.querySelector('.rp-dialog-close').click();document.querySelectorAll('.rp-focus-tabs button')[2].click();document.querySelectorAll('.rp-journey-selector button')[3].click()");
  const interactions=await evaluate("({focus:document.querySelector('.rp-focus-panel h3').textContent,journey:document.querySelector('.rp-dark-card h3').textContent})");
  await evaluate("document.querySelector('.cdr-course-hero-actions button').click()");await waitFor("!!document.querySelector('.cdr-download-link')");
  const download=await evaluate("document.querySelector('.cdr-download-link').href");
  await evaluate("document.querySelector('[aria-label=\"Close downloads\"]').click()");
  const result={...before,dialog,interactions,download,errors:[...errors]};results.push(result);console.log(JSON.stringify(result));
  if([1440,390].includes(width)){for(const [name,selector] of [['hero','#programme-overview'],['highlights','.rp-highlights'],['journey','.rp-journey'],['roadmap','.rp-roadmap'],['focus','.rp-focus'],['projects','.rp-projects'],['people','.rp-people']])await capture(width+'-'+name,selector);}
 }
 purchased=false;
 await send('Page.navigate',{url:'http://127.0.0.1:5182/courses/'+course._id});await waitFor("document.querySelector('.cdr-course-hero-actions button')?.textContent.includes('Buy Now')");
 await evaluate("document.querySelector('.cdr-course-hero-actions button').click()");await waitFor("location.pathname==='/cart'");
 const cart=await evaluate("JSON.parse(localStorage.getItem('rathi-cart')).map(c=>c.id)");
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({results,cart},null,2));
 if(results.some(r=>r.scrollWidth>r.width+1||r.brokenImages.length||r.errors.length||r.books!==6||!r.download.includes('drive.google.com'))||!cart.includes(course._id))throw Error('Course verification failed');
 console.log('PASS: responsive layout, loaded artwork, modules, topic tabs, journey selector, owned downloads and unpurchased cart flow.');
 await send('Browser.close');
}finally{socket?.close();vite.kill();chrome.kill();}



