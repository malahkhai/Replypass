import test from 'node:test';
import assert from 'node:assert/strict';
import { analyticsHostAllowed, analyticsPageLocation, pageGroup, readChoice, validMetaPixelId, X_CREATOR_REGISTRATION_EVENT_ID } from '../lib/analytics/model.ts';
test('analytics masks creator handles and private routes', () => {
 assert.equal(pageGroup('/@someone'), 'creator_profile');
 assert.equal(pageGroup('/creator/inbox/private-id'), 'creator_conversation');
 assert.equal(pageGroup('/auth/callback'), 'other');
 assert.equal(pageGroup('/creator/dashboard'), 'creator_dashboard');
 assert.equal(pageGroup('/unexpected/private'), 'other');
});
test('analytics keeps only safe campaign tags on grouped page URLs', () => {
 assert.equal(analyticsPageLocation('/creators','?utm_source=Meta&utm_medium=Paid_Social&utm_campaign=GRP-LPV-A&fbclid=secret'),
  'https://getreplypass.com/creator_landing?utm_source=meta&utm_medium=paid_social&utm_campaign=grp-lpv-a');
 assert.equal(analyticsPageLocation('/@someone','?utm_source=meta&utm_medium=paid_social&token=private'),
  'https://getreplypass.com/creator_profile?utm_source=meta&utm_medium=paid_social');
 assert.equal(analyticsPageLocation('/creator/inbox/private-id','?utm_source=jane%40example.com&utm_medium=paid_social&utm_campaign=private'),
  'https://getreplypass.com/creator_conversation');
 assert.equal(analyticsPageLocation('/creators','?utm_campaign=orphan&utm_term=private'),
  'https://getreplypass.com/creator_landing');
});
test('consent defaults to unknown and expires after 180 days', () => {
 const now=200*86400000;
 for(const raw of [null,'bad','{}',JSON.stringify({accepted:true,at:0}),JSON.stringify({accepted:true,at:now+1})]) assert.equal(readChoice(raw,now),null);
 assert.equal(readChoice(JSON.stringify({accepted:false,at:now}),now),false);
 assert.equal(readChoice(JSON.stringify({accepted:true,at:now}),now),true);
});
test('analytics accepts both production domain variants and rejects previews', () => {
 assert.equal(analyticsHostAllowed('getreplypass.com'),true);
 assert.equal(analyticsHostAllowed('www.getreplypass.com'),true);
 assert.equal(analyticsHostAllowed('replypass.vercel.app'),false);
 assert.equal(analyticsHostAllowed('localhost'),false);
});
test('Meta Pixel IDs must be numeric public identifiers', () => {
 assert.equal(validMetaPixelId('123456789012345'), true);
 assert.equal(validMetaPixelId(''), false);
 assert.equal(validMetaPixelId(undefined), false);
 assert.equal(validMetaPixelId('G-C6DL1WLHDM'), false);
 assert.equal(validMetaPixelId('123<script>'), false);
});
test('X creator conversion event belongs to ReplyPass pixel', () => {
 assert.match(X_CREATOR_REGISTRATION_EVENT_ID, /^tw-rha5c-[A-Za-z0-9_-]+$/);
});
