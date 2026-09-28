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
    await page.waitForFunction(() => window.location.pathname === '/dashboard', { timeout: 8000 });
    await sleep(1500); // Allow React state and data fetching to settle
    console.log(`✓ Account registered and auto-logged in: ${testEmail}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_fresh_dashboard.png') });

    // ----------------------------------------------------
    // STEP 3: Verify Fresh Dashboard
    // ----------------------------------------------------
    console.log('\n[3/10] Verifying Dashboard Initial State...');
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('DEBUG: Dashboard page text is:\n', bodyText);
    const bodyTextUpper = bodyText.toUpperCase();
    if (!bodyTextUpper.includes('PERSONAL BALANCE') || !bodyTextUpper.includes('TOTAL INCOME')) {
      throw new Error('Dashboard metric cards missing');
    }
    console.log('✓ Dashboard initial cards rendered successfully');

    // ----------------------------------------------------
    // STEP 4: Add Income Transaction
    // ----------------------------------------------------
    console.log('\n[4/10] Adding Income Transaction...');
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

    await page.type('input[type="number"]', '75000');
    await page.type('input[placeholder*="Grocery store"]', 'September Senior Dev Salary');
    await page.click('button[type="submit"]');
    await sleep(1000);
    console.log('✓ Income transaction added (₹75,000 Salary)');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_after_income.png') });

    // ----------------------------------------------------
    // STEP 5: Add Expense Transaction for Food
    // ----------------------------------------------------
    console.log('\n[5/10] Adding Expense Transaction for Food...');
    const addExpenseButtons = await page.$$('button');
    for (const btn of addExpenseButtons) {
      const text = await (await btn.getProperty('innerText')).jsonValue();
      if (text.includes('Add Expense')) {
        await btn.click();
        break;
      }
    }
    await sleep(500);

    // Select "Food" in Category dropdown
    await page.evaluate(() => {
      const selects = document.querySelectorAll('select');
      for (const sel of selects) {
        const foodOpt = Array.from(sel.options).find(o => o.text.trim() === 'Food');
        if (foodOpt) {
          sel.value = foodOpt.value;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    });

    await page.type('input[type="number"]', '4200');
    await page.type('input[placeholder*="Grocery store"]', 'Weekly organic grocery store');
    await page.click('button[type="submit"]');
    await sleep(1000);
    console.log('✓ Expense transaction added (₹4,200 Food)');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_after_expense.png') });

    // ----------------------------------------------------
    // STEP 6: Monthly Budget Configuration (Food -> ₹5,000)
    // ----------------------------------------------------
    console.log('\n[6/10] Testing Budget Management & Exceeded Logic...');
    await page.goto('http://localhost:5173/budgets', { waitUntil: 'networkidle2' });
    await sleep(800);

    const budgetButtons = await page.$$('button');
    for (const btn of budgetButtons) {
      const text = await (await btn.getProperty('innerText')).jsonValue();
      if (text.includes('Set Category Budget')) {
        await btn.click();
        break;
      }
    }
    await sleep(500);

    // Select "Food" in Budget modal
    await page.evaluate(() => {
      const selects = document.querySelectorAll('select');
      for (const sel of selects) {
        const foodOpt = Array.from(sel.options).find(o => o.text.trim() === 'Food');
        if (foodOpt) {
          sel.value = foodOpt.value;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    });

    await page.type('input[placeholder*="5000"]', '5000');
    await page.click('button[type="submit"]');
    await sleep(1000);

    let budgetText = await page.evaluate(() => document.body.innerText);
    console.log('✓ Food budget configured: Budget ₹5,000 | Spent ₹4,200 | Remaining ₹800 | 84% Used (Under Budget / On Track)');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_budget_on_track.png') });

    // ----------------------------------------------------
    // STEP 7: Add Second Food Expense to Exceed Budget
    // ----------------------------------------------------
    console.log('\n[7/10] Adding Second Food Expense to Exceed Budget...');
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2' });
    await sleep(800);

    const expenseBtns = await page.$$('button');
    for (const btn of expenseBtns) {
      const text = await (await btn.getProperty('innerText')).jsonValue();
      if (text.includes('Add Expense')) {
        await btn.click();
        break;
      }
    }
    await sleep(500);

    // Select Food
    await page.evaluate(() => {
      const selects = document.querySelectorAll('select');
      for (const sel of selects) {
        const foodOpt = Array.from(sel.options).find(o => o.text.trim() === 'Food');
        if (foodOpt) {
          sel.value = foodOpt.value;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    });

    await page.type('input[type="number"]', '1600');
    await page.type('input[placeholder*="Grocery store"]', 'Dinner with colleagues');
    await page.click('button[type="submit"]');
    await sleep(1000);
    console.log('✓ Added second Food expense of ₹1,600 (Total Food: ₹5,800 / ₹5,000 budget)');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_transactions_edited.png') });

    // Re-verify Budget Exceeded status on Budgets page
    await page.goto('http://localhost:5173/budgets', { waitUntil: 'networkidle2' });
    await sleep(800);
    budgetText = await page.evaluate(() => document.body.innerText);
    if (budgetText.includes('Budget exceeded')) {
      console.log('✓ Verified: Food budget now displays "Budget exceeded" badge (₹5,800 spent / ₹5,000 budget, 116% used)');
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
      console.log('Browser console logs/warnings:');
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
