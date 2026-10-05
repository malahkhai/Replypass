import test from "node:test";
import assert from "node:assert/strict";
import { creatorPath, creatorRedirect, isCreatorProfilePath } from "../lib/creators/paths.ts";
import { socialAudience, validFollowerCounts } from "../lib/creators/socials.ts";
import { validUsername } from "../lib/creators/validation.ts";
import { pageGroup } from "../lib/analytics/model.ts";
test("clean creator routes retain legacy interaction and campaign parameters", () => {
  assert.equal(creatorPath("@diane"), "/diane");
  assert.equal(creatorRedirect("@diane", { interaction:"vip", utm_source:"instagram", tag:["a","b"] }), "/diane?interaction=vip&utm_source=instagram&tag=a&tag=b");
  assert.equal(creatorRedirect("@diane", {}, "/vip"), "/diane/vip");
  assert.equal(creatorRedirect("diane"), null);
  for(const invalid of ["../login", "//attacker.com", "diane?next=x", "diane/vip"]) assert.throws(() => creatorPath(invalid));
  assert.equal(pageGroup("/diane"), "creator_profile");
  assert.equal(pageGroup("/login"), "login");
});
test("static pages cannot be claimed or mistaken for new creator destinations", () => {
  for (const name of ["vip","creators","privacy","terms","notifications","api","auth"]) {
    assert.equal(validUsername(name), false);
    assert.equal(isCreatorProfilePath(`/${name}`), false);
    assert.equal(creatorPath(name), `/@${name}`);
    assert.equal(creatorRedirect(`@${name}`), null);
  }
});
test("audience total only counts supplied figures attached to safe social links", () => {
  const a = socialAudience({ instagram:"https://instagram.com/diane", twitter:"https://x.com/diane", youtube:"https://youtube.com.attacker.test/diane", website:"javascript:alert(1)" }, {instagram:10000,twitter:500,youtube:99000,tiktok:100});
  assert.equal(a.total, 10500);
  assert.equal(a.counted, 2);
  assert.equal(a.links.length, 2);
  assert.equal(socialAudience({instagram:"https://instagram.com/diane"}).counted, 0);
  assert.equal(socialAudience({instagram:"https://instagram.com/diane"}, {instagram:0}).counted, 1);
  for (const value of [[],null,{instagram:-1},{instagram:1.2},{instagram:"100"},{website:10},{instagram:2_000_000_001}]) assert.equal(validFollowerCounts(value), false);
  assert.equal(validFollowerCounts({instagram:0,twitter:42}), true);
});
