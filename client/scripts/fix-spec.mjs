import { readFileSync, writeFileSync } from 'fs';

const f = 'd:/training/client/e2e/vocabularies.spec.ts';
// Normalize CRLF → LF so regex \n works consistently
let c = readFileSync(f, 'utf8').replace(/\r\n/g, '\n');

// 1. Remove screenshotStep wrapper for 'Login as admin' → direct call
c = c.replace(
  /    await screenshotStep\(page, testInfo, 'Login as admin', \(\) => loginAsAdmin\(page\)\);\n/g,
  '    await loginAsAdmin(page);\n',
);

// 2. Remove screenshotStep wrapper for 'Navigate to vocabulary list' (without expectTableHasRows)
c = c.replace(
  /    await screenshotStep\(page, testInfo, 'Navigate to vocabulary list', async \(\) => \{\n      await listPage\.goto\(\);\n      await listPage\.waitForTableLoad\(\);\n    \}\);\n/g,
  '    await listPage.goto();\n    await listPage.waitForTableLoad();\n',
);

// 3. Remove screenshotStep wrapper for 'Navigate to vocabulary list' (with expectTableHasRows)
c = c.replace(
  /    await screenshotStep\(page, testInfo, 'Navigate to vocabulary list', async \(\) => \{\n      await listPage\.goto\(\);\n      await listPage\.waitForTableLoad\(\);\n      await listPage\.expectTableHasRows\(\);\n    \}\);\n/g,
  '    await listPage.goto();\n    await listPage.waitForTableLoad();\n    await listPage.expectTableHasRows();\n',
);

// 4. Remove screenshotStep wrapper for 'Navigate to create form' (with createPage assert)
c = c.replace(
  /    await screenshotStep\(page, testInfo, 'Navigate to create form', async \(\) => \{\n      await formPage\.gotoCreate\(\);\n      await expect\(formPage\.createPage\)\.toBeVisible\(\);\n    \}\);\n/g,
  '    await formPage.gotoCreate();\n',
);

// 5. Remove screenshotStep wrapper for 'Navigate to create form' (plain)
c = c.replace(
  /    await screenshotStep\(page, testInfo, 'Navigate to create form', async \(\) => \{\n      await formPage\.gotoCreate\(\);\n    \}\);\n/g,
  '    await formPage.gotoCreate();\n',
);

writeFileSync(f, c, 'utf8');
console.log('Done. Lines:', c.split('\n').length);
console.log('Remaining "Login as admin" screenshotStep:', (c.match(/screenshotStep.*Login as admin/g) || []).length);
console.log('Remaining "Navigate to" screenshotStep:', (c.match(/screenshotStep.*Navigate to/g) || []).length);


// 1. Remove screenshotStep wrapper for 'Login as admin' → direct call
c = c.replace(
  /    await screenshotStep\(page, testInfo, 'Login as admin', \(\) => loginAsAdmin\(page\)\);\n/g,
  '    await loginAsAdmin(page);\n',
);

// 2. Remove screenshotStep wrapper for 'Navigate to vocabulary list' (without expectTableHasRows)
c = c.replace(
  /    await screenshotStep\(page, testInfo, 'Navigate to vocabulary list', async \(\) => \{\n      await listPage\.goto\(\);\n      await listPage\.waitForTableLoad\(\);\n    \}\);\n/g,
  '    await listPage.goto();\n    await listPage.waitForTableLoad();\n',
);

// 3. Remove screenshotStep wrapper for 'Navigate to vocabulary list' (with expectTableHasRows)
c = c.replace(
  /    await screenshotStep\(page, testInfo, 'Navigate to vocabulary list', async \(\) => \{\n      await listPage\.goto\(\);\n      await listPage\.waitForTableLoad\(\);\n      await listPage\.expectTableHasRows\(\);\n    \}\);\n/g,
  '    await listPage.goto();\n    await listPage.waitForTableLoad();\n    await listPage.expectTableHasRows();\n',
);

// 4. Remove screenshotStep wrapper for 'Navigate to create form' (with createPage assert)
c = c.replace(
  /    await screenshotStep\(page, testInfo, 'Navigate to create form', async \(\) => \{\n      await formPage\.gotoCreate\(\);\n      await expect\(formPage\.createPage\)\.toBeVisible\(\);\n    \}\);\n/g,
  '    await formPage.gotoCreate();\n',
);

// 5. Remove screenshotStep wrapper for 'Navigate to create form' (plain)
c = c.replace(
  /    await screenshotStep\(page, testInfo, 'Navigate to create form', async \(\) => \{\n      await formPage\.gotoCreate\(\);\n    \}\);\n/g,
  '    await formPage.gotoCreate();\n',
);

writeFileSync(f, c, 'utf8');
console.log('Done. Lines:', c.split('\n').length);
