import { Permissions, webMethod } from 'wix-web-module';
import { checkAllLinks } from 'backend/link-check';

// Admin-only manual trigger (e.g. from a dashboard page or the Velo console).
export const runLinkCheckNow = webMethod(Permissions.Admin, async () => checkAllLinks());
