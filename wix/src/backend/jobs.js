import { checkAllLinks } from 'backend/link-check';

// Scheduled by jobs.config (weekly).
export async function weeklyLinkCheck() {
  try {
    const summary = await checkAllLinks();
    console.log('Investor link check finished', JSON.stringify(summary));
  } catch (e) {
    console.error('Investor link check failed', e);
  }
}
