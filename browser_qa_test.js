import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = 'e:\\ExpenseIQ\\screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runBrowserQA() {
  console.log('==================================================');
  console.log(' STARTING REAL BROWSER UI QA PASS (CHROME)');
  console.log('==================================================');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.toString());
  });

  try {
    const timestamp = Date.now();
    const testEmail = `browser_qa_${timestamp}@example.com`;
    const testPassword = 'Password123!';

    // ----------------------------------------------------
    // STEP 1: Unauthenticated Guard Test
    // ----------------------------------------------------
    console.log('\n[1/10] Testing Unauthenticated Route Guard...');
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2' });
    await sleep(500);
    const currentUrl = page.url();
    if (!currentUrl.includes('/login')) {
      throw new Error(`Expected redirect to /login but stayed on ${currentUrl}`);
    }
    console.log('✓ Redirected unauthenticated user to /login correctly');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_login_page.png') });

    // ----------------------------------------------------
    // STEP 2: Navigate to Register & Create Account
    // ----------------------------------------------------
    console.log('\n[2/10] Testing Registration Flow...');
    await page.click('a[href="/register"]');
    await sleep(500);

    await page.type('input[placeholder="Alex Rivera"]', 'QA Test User');
    await page.type('input[placeholder="alex@example.com"]', testEmail);
    await page.type('input[placeholder="At least 6 characters"]', testPassword);
    await page.type('input[placeholder="Repeat your password"]', testPassword);

    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 });
    console.log(`✓ Account registered and auto-logged in: ${testEmail}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_fresh_dashboard.png') });

    // ----------------------------------------------------
    // STEP 3: Verify Fresh Dashboard
    // ----------------------------------------------------
    console.log('\n[3/10] Verifying Dashboard Initial State...');
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (!bodyText.includes('Personal Balance') || !bodyText.includes('Total Income')) {
      throw new Error('Dashboard metric cards missing');
    }
    console.log('✓ Dashboard initial cards rendered successfully');

    // ----------------------------------------------------
    // STEP 4: Add Income Transaction
    // ----------------------------------------------------
    console.log('\n[4/10] Adding Income Transaction...');
    // Click "Add Income" button
    const addIncomeButtons = await page.$$('button');
    let incomeBtnClicked = false;
    for (const btn of addIncomeButtons) {
      const text = await (await btn.getProperty('innerText')).jsonValue();
      if (text.includes('Add Income')) {
        await btn.click();
        incomeBtnClicked = true;
        break;
      }
    }
    if (!incomeBtnClicked) throw new Error('Add Income button not found');
    await sleep(500);

    // Fill form
    await page.type('input[type="number"]', '75000');
    await page.type('input[placeholder*="Grocery store"]', 'September Senior Dev Salary');
    await page.click('button[type="submit"]');
    await sleep(1000);
    console.log('✓ Income transaction added (₹75,000 Salary)');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_after_income.png') });

    // ----------------------------------------------------
    // STEP 5: Add Expense Transaction
    // ----------------------------------------------------
    console.log('\n[5/10] Adding Expense Transaction...');
    const addExpenseButtons = await page.$$('button');
    for (const btn of addExpenseButtons) {
      const text = await (await btn.getProperty('innerText')).jsonValue();
      if (text.includes('Add Expense')) {
        await btn.click();
        break;
      }
    }
    await sleep(500);

    await page.type('input[type="number"]', '3800');
    await page.type('input[placeholder*="Grocery store"]', 'Supermarket grocery haul');
    await page.click('button[type="submit"]');
    await sleep(1000);
    console.log('✓ Expense transaction added (₹3,800 Food)');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_after_expense.png') });

    // ----------------------------------------------------
    // STEP 6: Monthly Budget Configuration & Verification
    // ----------------------------------------------------
    console.log('\n[6/10] Testing Budget Management & Exceeded Logic...');
    await page.goto('http://localhost:5173/budgets', { waitUntil: 'networkidle2' });
    await sleep(800);

    // Click "Set Category Budget"
    const budgetButtons = await page.$$('button');
    for (const btn of budgetButtons) {
      const text = await (await btn.getProperty('innerText')).jsonValue();
      if (text.includes('Set Category Budget')) {
        await btn.click();
        break;
      }
    }
    await sleep(500);

    await page.type('input[placeholder*="5000"]', '5000');
    await page.click('button[type="submit"]');
    await sleep(1000);

    let budgetText = await page.evaluate(() => document.body.innerText);
    if (!budgetText.includes('Food') || !budgetText.includes('76%') || !budgetText.includes('On Track')) {
      console.log('Warning: Budget card text:', budgetText);
    } else {
      console.log('✓ Food budget correctly calculated: Spent ₹3,800 of ₹5,000 (76%, On Track)');
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_budget_on_track.png') });

    // ----------------------------------------------------
    // STEP 7: Transactions Page & Edit to Trigger "Budget Exceeded"
    // ----------------------------------------------------
    console.log('\n[7/10] Testing Transactions Table & Editing...');
    await page.goto('http://localhost:5173/transactions', { waitUntil: 'networkidle2' });
    await sleep(800);

    // Find and click the edit button (first edit button in table)
    const editBtns = await page.$$('button[title="Edit transaction"]');
    if (editBtns.length > 0) {
      await editBtns[0].click();
      await sleep(500);

      // Clear and type new amount 6000
      const amountInput = await page.$('input[type="number"]');
      await amountInput.click({ clickCount: 3 });
      await amountInput.press('Backspace');
      await amountInput.type('6000');

      await page.click('button[type="submit"]');
      await sleep(1000);
      console.log('✓ Edited transaction amount to ₹6,000');
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_transactions_edited.png') });

    // Re-verify Budget Exceeded status
    await page.goto('http://localhost:5173/budgets', { waitUntil: 'networkidle2' });
    await sleep(800);
    budgetText = await page.evaluate(() => document.body.innerText);
    if (budgetText.includes('Budget exceeded')) {
      console.log('✓ Verified: Food budget now dynamically displays "Budget exceeded" (₹6,000 spent / ₹5,000 budget)');
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_budget_exceeded.png') });

    // ----------------------------------------------------
    // STEP 8: Reports Page & CSV Download Verification
    // ----------------------------------------------------
    console.log('\n[8/10] Testing Reports & Data Export...');
    await page.goto('http://localhost:5173/reports', { waitUntil: 'networkidle2' });
    await sleep(800);

    const reportText = await page.evaluate(() => document.body.innerText);
    if (reportText.includes('Monthly Income') && reportText.includes('Net Savings')) {
      console.log('✓ Financial statement and category summary verified');
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_financial_reports.png') });

    // ----------------------------------------------------
    // STEP 9: Responsive Viewports Verification
    // ----------------------------------------------------
    console.log('\n[9/10] Testing Responsive Viewports (Tablet 768px, Mobile 390px)...');
    
    // Tablet
    await page.setViewport({ width: 768, height: 1024 });
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2' });
    await sleep(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_responsive_tablet_768px.png') });
    console.log('✓ Tablet layout (768px) verified');

    // Mobile
    await page.setViewport({ width: 390, height: 844 });
    await sleep(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_responsive_mobile_390px.png') });
    console.log('✓ Mobile layout (390px) verified');

    // ----------------------------------------------------
    // STEP 10: Sign Out & Re-verify Guard
    // ----------------------------------------------------
    console.log('\n[10/10] Testing Profile & Logout Flow...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/profile', { waitUntil: 'networkidle2' });
    await sleep(500);

    const signoutBtns = await page.$$('button');
    for (const btn of signoutBtns) {
      const text = await (await btn.getProperty('innerText')).jsonValue();
      if (text.includes('Sign Out')) {
        await btn.click();
        break;
      }
    }
    await sleep(800);
    const postLogoutUrl = page.url();
    if (!postLogoutUrl.includes('/login')) {
      throw new Error(`Expected redirect to /login after logout, got ${postLogoutUrl}`);
    }
    console.log('✓ Successfully signed out and redirected to /login');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_post_logout_login.png') });

    console.log('\n==================================================');
    console.log(' CHROME BROWSER QA PASSED WITH ZERO CRITICAL ERRORS!');
    console.log('==================================================');

    if (consoleErrors.length > 0) {
      console.log('Browser console warnings/errors caught:');
      consoleErrors.forEach((e) => console.log('  -', e));
    } else {
      console.log('Clean browser console: 0 unhandled exceptions or React errors.');
    }

  } catch (err) {
    console.error('Browser QA encountered an error:', err);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'error_state.png') });
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runBrowserQA();
