import test from "node:test";
import assert from "node:assert/strict";
import { campaignFromSearch } from "../lib/analytics/campaign.ts";

test("first-party campaign attribution keeps only bounded UTM tags", () => {
  assert.deepEqual(campaignFromSearch("?utm_source=Meta&utm_medium=Paid_Social&utm_campaign=GRP-LPV-A&fbclid=private"), {
    source: "meta", medium: "paid_social", campaign: "grp-lpv-a",
  });
  assert.equal(campaignFromSearch("?utm_source=meta"), null);
  assert.equal(campaignFromSearch("?utm_source=jane%40example.com&utm_medium=paid_social"), null);
  assert.deepEqual(campaignFromSearch("?utm_source=x&utm_medium=paid_social"), {
    source: "x", medium: "paid_social", campaign: "unspecified",
  });
});
