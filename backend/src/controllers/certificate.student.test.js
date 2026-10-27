import test from "node:test";
import assert from "node:assert/strict";
import Certificate from "../models/Certificate.js";
import Enrollment from "../models/Enrollment.js";
import Progress from "../models/Progress.js";
import { myCertificates } from "./certificate.controller.js";
const query = rows => ({ populate(){return this;}, sort(){return this;}, then(resolve,reject){return Promise.resolve(rows).then(resolve,reject);} });
async function load(t, certificates=[], enrollments=[], progress=[]) {
 t.mock.method(Certificate,"find",filter=>{assert.deepEqual(filter,{user:"current-student"});return query(certificates);});
 t.mock.method(Enrollment,"find",filter=>{assert.deepEqual(filter,{user:"current-student",status:{$ne:"cancelled"}});return query(enrollments);});
 t.mock.method(Progress,"find",filter=>{assert.deepEqual(filter,{user:"current-student"});return query(progress);});
 const res={json(body){this.body=body;}};
 await myCertificates({user:{_id:"current-student"}},res);return res.body;
}
test("new student sees real empty certificate and enrollment totals",async t=>{
 const result=await load(t);assert.deepEqual(result,{certificates:[],inProgress:[],summary:{earned:0,completed:0,progress:0}});
});
test("earned courses excluded from in-progress cards and completion counted once",async t=>{
 const certificate={certificateId:"real-issued-id",course:{_id:"earned",title:"Issued course"},user:{name:"Learner"}};
 const result=await load(t,[certificate],[{course:certificate.course,status:"completed"},{course:{_id:"learning",title:"Learning course"},status:"active"},{course:{_id:"awaiting",title:"Awaiting issue"},status:"completed"}],[{course:"learning",percentage:37}]);
 assert.deepEqual(result.summary,{earned:1,completed:2,progress:2});
 assert.deepEqual(result.inProgress.map(r=>[r.course._id,r.percentage]),[["learning",37],["awaiting",100]]);
 assert.equal(result.certificates[0].certificateId,"real-issued-id");
});
test("missing courses ignored and missing or excessive progress handled",async t=>{
 const result=await load(t,[],[{course:null,status:"active"},{course:{_id:"new"},status:"active"},{course:{_id:"complete"},status:"active"}],[{course:"complete",percentage:150}]);
 assert.deepEqual(result.inProgress.map(r=>r.percentage),[0,100]);assert.equal(result.summary.completed,1);
});
