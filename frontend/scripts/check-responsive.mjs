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
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--disable-background-networking','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--no-first-run','--no-default-browser-check','--no-proxy-server','--disable-extensions','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:['ignore',browserLog,browserLog]});
let socket,role='student',nextId=0,bootId;
let browserPort;
const pending=new Map(),errors=[];
const course={_id:'507f1f77bcf86cd799439011',title:'Digital Marketing and Analytics Masterclass',slug:'marketing',price:4999,originalPrice:9999,thumbnail:'/digital-marketing-course.jpg',description:'Learn practical marketing, analytics and project skills.',shortDescription:'Build real marketing skills.',instructor:{_id:'507f1f77bcf86cd799439012',name:'Experienced Instructor',email:'mentor@example.test'},isPublished:true,category:'Marketing',curriculum:[{title:'Marketing fundamentals',submodules:['Introduction','Planning']}],skills:['Marketing','Analytics'],accessOptions:['individual'],tags:[],rating:4.8,durationMinutes:600};
const user=()=>({_id:'507f1f77bcf86cd799439013',id:'507f1f77bcf86cd799439013',name:'Student With A Long Display Name',email:'long.student.email.address@example.test',role,phone:'9876543210',isActive:true,adminAccess:true,adminPermissions:['reports','instructors','dashboard','revenue','courses','employees','certificates','instructor_portal'],emailVerified:true});
const fixture=url=>{
 const p=new URL(url).pathname.replace(/^\/api/,'');
 if(p==='/auth/me')return{user:user()};
 if(p==='/admin/subscriptions')return{subscriptions:[],mentors:[],logs:[],settings:{expiringDays:30,defaultSessions:5}};
 if(p==='/users/me/settings')return{account:user(),preferences:{emailNotifications:true,courseUpdates:true,assignmentReminders:true,mentorSessionReminders:true,communityUpdates:false}};
 if(p==='/admin/notifications')return{notifications:[{id:'507f1f77bcf86cd799439015',type:'mentor',title:'Mentor session requested',message:'A student requested a mentor session for their course.',link:'/admin/instructors/507f1f77bcf86cd799439012?tab=sessions',createdAt:new Date().toISOString(),read:false}],unreadCount:1};
 if(p==='/courses')return{courses:[course,{...course,_id:'507f1f77bcf86cd799439021',title:'Data Analytics Mastery',category:'Data Analytics'},{...course,_id:'507f1f77bcf86cd799439031',title:'AI Automation Mastery',category:'AI & Automation'}],total:3};
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
 for(const width of widths){await send('Emulation.setDeviceMetricsOverride',{width,height:Number(process.env.RESPONSIVE_HEIGHT)||(width<600?760:900),deviceScaleFactor:1,mobile:false});
  for(const route of routes){role=route.startsWith('/admin')?'admin':'student';errors.length=0;if(bootId)await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:bootId});const guest=['/login','/signup'].includes(route);const boot=await send('Page.addScriptToEvaluateOnNewDocument',{source:guest?"localStorage.removeItem('rathi-token');localStorage.removeItem('rathi-user');":"localStorage.setItem('rathi-token','responsive-test');localStorage.setItem('rathi-user',"+JSON.stringify(JSON.stringify(user()))+");"});bootId=boot.identifier;const navigation=await send('Page.navigate',{url:'http://127.0.0.1:5178'+route});if(navigation.errorText)throw Error(navigation.errorText);for(let attempt=0;attempt<60;attempt++){const ready=await send('Runtime.evaluate',{returnByValue:true,expression:"!!document.querySelector('#root')?.textContent.trim()"});if(ready.result.value)break;await sleep(150);}await sleep(500);
   const measured=await send('Runtime.evaluate',{returnByValue:true,expression:`(()=>{const width=document.documentElement.clientWidth;const root=document.querySelector('#root');const bad=[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);if(!r.width||!r.height||s.position==='absolute'||s.position==='fixed'||s.visibility==='hidden')return false;let p=e.parentElement;while(p&&p!==document.body){if(['auto','scroll','hidden','clip'].includes(getComputedStyle(p).overflowX))return false;p=p.parentElement;}return r.right>width+2||r.left<-2;}).slice(0,8).map(e=>({tag:e.tagName,class:e.className,text:e.textContent.slice(0,65)}));return{url:location.pathname,bodyWidth:document.documentElement.scrollWidth,viewport:width,requestedWidth:innerWidth,rendered:!!root?.textContent.trim(),overflow:bad};})()`});
   const result={route,width,...measured.result.value,errors:[...errors]};results.push(result);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));console.log('Checked '+width+' '+route);if(result.bodyWidth > result.viewport+1 || result.overflow?.length||result.errors.length||!result.rendered)console.log(JSON.stringify(result));
   if(result.bodyWidth > result.viewport+1){const details=await send('Runtime.evaluate',{returnByValue:true,expression:"[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>document.documentElement.clientWidth+1 && getComputedStyle(e).position!=='fixed'}).slice(0,18).map(e=>({tag:e.tagName,class:e.className,width:e.getBoundingClientRect().width,min:getComputedStyle(e).minWidth,overflow:getComputedStyle(e).overflowX}))"});console.log('WIDE ELEMENTS '+JSON.stringify(details.result.value));}
   if([320,390,768,1440].includes(width)&&['/','/landing','/courses','/courses/'+course._id,'/cart','/dashboard','/settings','/admin','/admin/instructors','/login','/signup'].includes(route)){const screenshot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,(route.replaceAll('/','_')||'home')+'-'+width)+'.png',Buffer.from(screenshot.data,'base64'));}

   if(width<800) {
    const interactions=route==='/' ? [
      ['mobile-menu',"document.querySelector('.cab-mobile-toggle')?.click()",'.cab-menu-open',"document.querySelector('.cab-mobile-toggle')?.click()"],
      ['counselling',"document.querySelector('.cab-mobile-toggle')?.click();document.querySelector('.cab-menu button')?.click()",'.cab-counselling[open]',"document.querySelector('.cab-counselling-close')?.click()"]
     ] : route==='/courses' ? [['customizer',"document.querySelector('.pc-customize')?.click()",'.cc-dialog[open]',"document.querySelector('.cc-close')?.click()"]]
     : route==='/dashboard' ? [['student-menu',"document.querySelector('[aria-label=\"Open student navigation\"]')?.click()",'.student-sidebar',"document.querySelector('[aria-label=\"Close student navigation\"]')?.click()"]]
     : route==='/admin' ? [['admin-menu',"document.querySelector('.admin-menu-toggle')?.click()",'.admin-sidebar',"document.querySelector('.admin-menu-toggle')?.click()"]] : [];
    for(const [name,open,selector,close] of interactions){
     await send('Runtime.evaluate',{expression:open});await sleep(200);
     const measurement=await send('Runtime.evaluate',{returnByValue:true,expression:"(()=>{const e=document.querySelector("+JSON.stringify(selector)+");if(!e)return {rendered:false,overflow:[{text:'Expected control did not open'}]};const r=e.getBoundingClientRect();return {rendered:!!(r.width&&r.height),overflow:r.left < -2 || r.right > innerWidth+2 || r.top < -2 || r.bottom > innerHeight+2 ? [{text:'Control outside viewport',left:r.left,right:r.right,top:r.top,bottom:r.bottom}]:[]};})()"});
     const item={route:route+' ['+name+']',width,...measurement.result.value,errors:[...errors]};results.push(item);if(!item.rendered||item.overflow.length)console.log(JSON.stringify(item));
     if(width===390){const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,name+'-'+width+'.png'),Buffer.from(shot.data,'base64'));}
     await send('Runtime.evaluate',{expression:close});await sleep(100);
    }
   }
   if(width<768 && route==='/') {
    const layout=await send('Runtime.evaluate',{returnByValue:true,expression:`(async()=>{await document.fonts.ready;const footer=document.querySelector('.cab-footer-grid');const a=footer.children[1].getBoundingClientRect(),b=footer.children[2].getBoundingClientRect();const tools=[...document.querySelectorAll('.orbit-tool')];return{fontLoaded:document.fonts.check('16px Inter'),footerSideBySide:Math.abs(a.top-b.top)<2&&b.left>a.left,heroToolsCorrect:tools.length===4&&!document.querySelector('.orbit-art')?.textContent.includes('n8n')};})()` ,awaitPromise:true});
    const checks=layout.result.value;
    const failures=Object.entries(checks||{}).filter(([,ok])=>!ok).map(([name])=>name);
    results.push({route:'/ [mobile layout]',width,rendered:!!checks,overflow:[],errors:failures});
    console.log('Mobile layout '+width+' '+JSON.stringify(checks));
   }
   if(width===390 && route==='/') {
    const sections=['.orbit-art','.cab-connected','.cab-tools','.cab-community','.cab-footer','.cab-courses'];
    for(let i=0;i<sections.length;i++){
     const found=await send('Runtime.evaluate',{returnByValue:true,expression:"(()=>{const el=document.querySelector("+JSON.stringify(sections[i])+");if(!el)return false;el.scrollIntoView({block:'start',behavior:'instant'});return true;})()"});
     if(found.result.value){await sleep(200);const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,'home-section-'+i+'.png'),Buffer.from(shot.data,'base64'));}
    }
   }

  }
  console.log('Checked width '+width);
 }
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));console.log('Checked '+results.length+' route/viewport combinations; fixtures used, no real account changes.');
 console.log('RESULTS '+JSON.stringify({total:results.length,rendered:results.filter(r=>r.rendered).length,errors:results.filter(r=>r.errors.length).length,overflow:results.filter(r=>r.overflow.length || r.bodyWidth > r.viewport+1).length}));
 if(results.some(r=>!r.rendered||r.errors.length||r.overflow.length||r.bodyWidth>r.viewport+1))process.exitCode=1;
 await send('Browser.close');
}finally{socket?.close();vite.kill();chrome.kill();}



