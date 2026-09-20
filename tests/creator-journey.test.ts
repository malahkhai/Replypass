import test from 'node:test';
import assert from 'node:assert/strict';
import {safeNext,signupAllowed,isCreatorDestination} from '../lib/auth/paths.ts';
test('fan authentication keeps the creator and interaction without accepting external redirects',()=>{
 for(const next of ['/@stella','/@alex_model?interaction=message','/@stella?interaction=vip']) {
  assert.equal(safeNext(next),next);assert.ok(signupAllowed(next));assert.ok(isCreatorDestination(next));
 }
 for(const next of ['https://evil.test','//evil.test','/@stella?next=https://evil.test','/@stella?interaction=unknown','/@stella%2f..','/account?creator=stella']){
  assert.equal(safeNext(next),'/account');assert.equal(signupAllowed(next),false);
 }
});
test('fan signup works directly while unsafe destinations stay blocked',()=>{
 for(const next of [undefined,null,'','/account'])assert.equal(signupAllowed(next),true);
 assert.equal(signupAllowed('/creator/dashboard'),false);
 assert.ok(signupAllowed('/creator/apply'));assert.equal(safeNext('/creator/apply'),'/creator/apply');
 assert.equal(safeNext('/reset-password'),'/reset-password');
});
