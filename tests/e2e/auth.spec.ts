import { expect } from '@playwright/test';
import { testWithII } from '@dfinity/internet-identity-playwright';

testWithII('should sign-in with a new user via connect page', async ({ page, iiPage }) => {
    testWithII.setTimeout(90000);

    await page.goto('/');

    const connectWalletLink = page.getByRole('link', { name: 'CONNECT WALLET' });
    await expect(connectWalletLink).toBeVisible({ timeout: 10000 });
    await connectWalletLink.click();

    await expect(page).toHaveURL('/connect/', { timeout: 10000 });

    const internetIdentityButtonSelectorOnConnectPage = 'button:has-text("Internet Identity")';

    console.log(`Attempting to click: ${internetIdentityButtonSelectorOnConnectPage} on /connect/ page to trigger II`);
    await iiPage.signInWithNewIdentity({
        selector: internetIdentityButtonSelectorOnConnectPage,
        captcha: true
    });

    await expect(page.getByRole('link', { name: 'CONNECT WALLET' })).not.toBeVisible({ timeout: 20000 });

    console.log('User should be logged in and redirected back to the dApp.');
});

testWithII.beforeEach(async ({ iiPage, browser }) => {
    const url = 'http://127.0.0.1:8080';
    const canisterId = 'rdmx6-jaaaa-aaaaa-aaadq-cai';
    const timeout = 30000;

    await iiPage.waitReady({ url, canisterId, timeout });
});
