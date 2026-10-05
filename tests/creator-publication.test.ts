import test from 'node:test';
import assert from 'node:assert/strict';
import { creatorPublication } from '../lib/creators/publication.ts';

test('only completed, approved creators receive a public profile link', () => {
  for (const status of ['draft', 'pending', 'submitted', 'under_review', 'rejected', 'suspended', undefined]) {
    const result = creatorPublication({ username: 'slthedj', publicationStatus: status, onboardingComplete: true });
    assert.equal(result.published, false, String(status));
    assert.equal(result.href, '/creator/preview');
  }
  assert.equal(creatorPublication({ username: 'slthedj', publicationStatus: 'approved', onboardingComplete: false }).published, false);
  const approved = creatorPublication({ username: 'slthedj', publicationStatus: 'approved', onboardingComplete: true });
  assert.equal(approved.href, '/slthedj');
  assert.equal(approved.published, true);
});

test('publication notices distinguish review from rejection and suspension', () => {
  const creator = { username: 'slthedj', onboardingComplete: true };
  assert.equal(creatorPublication({ ...creator, publicationStatus: 'submitted' }).title, 'Verify your email to publish');
  assert.equal(creatorPublication({ ...creator, publicationStatus: 'rejected' }).title, 'Your application needs attention');
  assert.equal(creatorPublication({ ...creator, publicationStatus: 'suspended' }).title, 'Your page is unavailable');
});
