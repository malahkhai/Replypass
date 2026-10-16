import test from "node:test";
import assert from "node:assert/strict";
import { renderEmail } from "../lib/email/templates.ts";

test("creator setup email is branded, actionable, and escapes names", () => {
  const message = renderEmail("creator_setup", "https://getreplypass.com/creator/apply", "Teanna <script>");
  assert.equal(message.subject, "Teanna, finish your ReplyPass creator page");
  assert.match(message.text, /Create my page: https:\/\/getreplypass\.com\/creator\/apply/);
  assert.match(message.html, /replypass<span/);
  assert.match(message.html, /Hi Teanna,/);
  assert.doesNotMatch(message.html, /<script>/);
  assert.match(message.html, /Manage creator reminders/);
  const escaped = renderEmail("creator_setup", "https://getreplypass.com/creator/apply", "<script>");
  assert.match(escaped.html, /Hi &lt;script&gt;,/);
});

test("published page email carries the creator's exact public link", () => {
  const message = renderEmail("creator_page_live", "https://getreplypass.com/teanna", "Teanna");
  assert.match(message.text, /https:\/\/getreplypass\.com\/teanna/);
  assert.match(message.html, /href="https:\/\/getreplypass\.com\/teanna"/);
});
