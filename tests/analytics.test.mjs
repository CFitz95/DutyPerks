import test from 'node:test';
import assert from 'node:assert/strict';
import { publicAnalyticsUrl } from '../lib/analytics-core.mjs';

test('analytics removes search filters, tokens and fragments from public URLs', () => {
  assert.equal(publicAnalyticsUrl('https://duty-perks-angs.vercel.app/explore?status=veteran&location=92101&token=secret#private'), 'https://duty-perks-angs.vercel.app/explore');
});
test('analytics rejects admin, auth, API, unknown routes and other hosts', () => {
  for (const path of ['/admin', '/admin/locations', '/auth/callback', '/api/feedback', '/people/person@example.com']) {
    assert.equal(publicAnalyticsUrl('https://duty-perks-angs.vercel.app' + path), null);
  }
  for (const url of ['not a URL', 'http://duty-perks-angs.vercel.app/', 'https://preview.vercel.app/', 'https://duty-perks.vercel.app/']) assert.equal(publicAnalyticsUrl(url), null);
});
