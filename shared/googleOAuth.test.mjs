import test from 'node:test';
import assert from 'node:assert/strict';
import { googleClientId, GOOGLE_WEB_CLIENT_ID } from './googleOAuth.mjs';
test('missing or blank host variables use the same public Google app',()=>{
 for(const value of [undefined,null,'','  ']) assert.equal(googleClientId(value),GOOGLE_WEB_CLIENT_ID);
 assert.match(GOOGLE_WEB_CLIENT_ID,/\.apps\.googleusercontent\.com$/);
});
test('explicit host configuration overrides the public default',()=>{
 assert.equal(googleClientId('  other-app.apps.googleusercontent.com  '),'other-app.apps.googleusercontent.com');
});
