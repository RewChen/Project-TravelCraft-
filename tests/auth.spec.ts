import { test, expect } from '@playwright/test';

test.describe('Pocket Odyssey - Auth & Registration Module', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
  });

  /* -------------------------------------------------------------------------- */
  /*                      W3-1: พัฒนาระบบสมัครสมาชิก (Register)                   */
  /* -------------------------------------------------------------------------- */

  test('TC-I1-W3-1-001: สมัครสมาชิกสำเร็จด้วยข้อมูลที่ถูกต้อง (Happy Path)', async ({ page }) => {
    await page.locator('header button').last().click();
    await page.getByRole('button', { name: 'New Trainer? Register' }).click();

    // Fill form details
    await page.getByRole('combobox').selectOption('Novice Traveler');
    await page.getByRole('button', { name: '🧙' }).click();
    await page.getByRole('textbox', { name: 'e.g. Ash K.' }).fill('Happy Trainer');

    const uniqueEmail = `trainer_${Date.now()}@pallettown.com`;
    await page.getByRole('textbox', { name: 'trainer@pallettown.com' }).fill(uniqueEmail);
    await page.getByRole('textbox', { name: '••••••••' }).first().fill('123456');
    await page.getByRole('textbox', { name: '••••••••' }).nth(1).fill('123456');

    await page.getByRole('button', { name: 'START ADVENTURE' }).click();
    await page.screenshot({ path: 'screenshots/สมัครสมาชิกสำเร็จ.png' });
  });

  test('TC-I1-W3-1-002: สมัครสมาชิกไม่สำเร็จ - Email เคยลงทะเบียนไปแล้ว (Duplicate Email)', async ({ page }) => {
    await page.locator('header button').last().click();
    await page.getByRole('button', { name: 'New Trainer? Register' }).click();

    await page.getByRole('button', { name: '🤠' }).click();
    await page.getByRole('textbox', { name: 'e.g. Ash K.' }).fill('Duplicate Trainer');
    await page.getByRole('textbox', { name: 'trainer@pallettown.com' }).fill('zojer@gmail.com');
    await page.getByRole('textbox', { name: '••••••••' }).first().fill('123456');
    await page.getByRole('textbox', { name: '••••••••' }).nth(1).fill('123456');

    await page.getByRole('button', { name: 'START ADVENTURE' }).click();

    // Verify Error Alert is visible
    await expect(page.getByText('This email is already registered. Please log in instead.')).toBeVisible();
    await page.screenshot({ path: 'screenshots/สมัครสมาชิกไม่สำเร็จ(Email ซ้ำ).png' });
  });

  test('TC-I1-W3-1-003: สมัครสมาชิกไม่สำเร็จ - Secret Key สั้นกว่า 6 ตัวอักษร (Password Length)', async ({ page }) => {
    await page.locator('header button').last().click();
    await page.getByRole('button', { name: 'New Trainer? Register' }).click();

    await page.getByRole('textbox', { name: 'e.g. Ash K.' }).fill('Short Pass Trainer');
    await page.getByRole('textbox', { name: 'trainer@pallettown.com' }).fill('shortpass@pallettown.com');
    await page.getByRole('textbox', { name: '••••••••' }).first().fill('12345');
    await page.getByRole('textbox', { name: '••••••••' }).nth(1).fill('12345');

    await page.getByRole('button', { name: 'START ADVENTURE' }).click();

    // Verify Error Alert for short password
    await expect(page.getByText('Secret Key must be at least 6 characters long.')).toBeVisible();
    await page.screenshot({ path: 'screenshots/สมัครสมาชิกไม่สำเร็จ(Password สั้น).png' });
  });

  test('TC-I1-W3-1-004: สมัครสมาชิกไม่สำเร็จ - Secret Key และ Confirm Secret Key ไม่ตรงกัน (Password Mismatch)', async ({ page }) => {
    await page.locator('header button').last().click();
    await page.getByRole('button', { name: 'New Trainer? Register' }).click();

    await page.getByRole('textbox', { name: 'e.g. Ash K.' }).fill('Mismatch Trainer');
    await page.getByRole('textbox', { name: 'trainer@pallettown.com' }).fill('mismatch@pallettown.com');
    await page.getByRole('textbox', { name: '••••••••' }).first().fill('123456');
    await page.getByRole('textbox', { name: '••••••••' }).nth(1).fill('654321');

    await page.getByRole('button', { name: 'START ADVENTURE' }).click();

    // Verify Error Alert for password mismatch
    await expect(page.getByText('Secret Key and Confirm Secret Key do not match!')).toBeVisible();
    await page.screenshot({ path: 'screenshots/สมัครสมาชิกไม่สำเร็จ(Password ไม่ตรงกัน).png' });
  });

  /* -------------------------------------------------------------------------- */
  /*                      W3-2: พัฒนาระบบเข้าสู่ระบบ (Login)                       */
  /* -------------------------------------------------------------------------- */

  test('TC-I1-W3-2-001: เข้าสู่ระบบสำเร็จด้วย Email และ Password ที่ถูกต้อง (Happy Path)', async ({ page }) => {
    await page.locator('header button').last().click();
    await expect(page.getByRole('heading', { name: 'Login to TravelCraft' })).toBeVisible();

    await page.getByPlaceholder('your@email.com').fill('zojer@gmail.com');
    await page.getByPlaceholder('••••••••').fill('123456');

    await page.getByRole('button', { name: 'Start Adventure / Enter Command' }).click();
    await page.screenshot({ path: 'screenshots/เข้าสู่ระบบสำเร็จด้วย Email และ Password ที่ถูกต้อง.png' });
  });

  test('TC-I1-W3-2-002: เข้าสู่ระบบไม่สำเร็จ - Secret Key ไม่ถูกต้อง (Invalid Password)', async ({ page }) => {
    await page.locator('header button').last().click();
    await expect(page.getByRole('heading', { name: 'Login to TravelCraft' })).toBeVisible();

    await page.getByPlaceholder('your@email.com').fill('zojer@gmail.com');
    await page.getByPlaceholder('••••••••').fill('wrongpassword');

    await page.getByRole('button', { name: 'Start Adventure / Enter Command' }).click();
    await page.screenshot({ path: 'screenshots/เข้าสู่ระบบไม่สำเร็จ(Password ไม่ถูกต้อง).png' });
  });

  test('TC-I1-W3-2-003: เข้าสู่ระบบไม่สำเร็จ - Email ไม่มีในระบบ (Unregistered Email)', async ({ page }) => {
    await page.locator('header button').last().click();
    await expect(page.getByRole('heading', { name: 'Login to TravelCraft' })).toBeVisible();

    await page.getByPlaceholder('your@email.com').fill('unregistered_trainer_999@pallettown.com');
    await page.getByPlaceholder('••••••••').fill('123456');

    await page.getByRole('button', { name: 'Start Adventure / Enter Command' }).click();
    await page.screenshot({ path: 'screenshots/เข้าสู่ระบบไม่สำเร็จ(Email ไม่มีในระบบ).png' });
  });

  test('TC-I1-W3-2-004: เข้าสู่ระบบด้วยบัญชี Admin และตรวจสอบสิทธิ์ (Admin Login & Privilege Check)', async ({ page }) => {
    await page.locator('header button').last().click();
    await expect(page.getByRole('heading', { name: 'Login to TravelCraft' })).toBeVisible();

    await page.getByPlaceholder('your@email.com').fill('admin@travelcraft.com');
    await page.getByPlaceholder('••••••••').fill('123456');
    await page.getByRole('button', { name: 'Start Adventure / Enter Command' }).click();

    // Verify Admin button appears in Header
    const adminHeaderBtn = page.getByRole('button', { name: /Admin/i });
    await expect(adminHeaderBtn).toBeVisible();

    // Open Admin Command Center
    await adminHeaderBtn.click();
    await expect(page.getByText('COMMAND CENTER')).toBeVisible();
    await page.screenshot({ path: 'screenshots/Admin_Login_And_Command_Center.png' });
  });

  test('TC-I1-W3-2-005: เข้าสู่ระบบด้วยบัญชี Regular User (User Login & Non-Admin Check)', async ({ page }) => {
    await page.locator('header button').last().click();
    await page.getByRole('button', { name: 'New Trainer? Register' }).click();

    const uniqueEmail = `regular_user_${Date.now()}@pallettown.com`;
    await page.getByRole('textbox', { name: 'e.g. Ash K.' }).fill('Regular User');
    await page.getByRole('textbox', { name: 'trainer@pallettown.com' }).fill(uniqueEmail);
    await page.getByRole('textbox', { name: '••••••••' }).first().fill('123456');
    await page.getByRole('textbox', { name: '••••••••' }).nth(1).fill('123456');
    await page.getByRole('button', { name: 'START ADVENTURE' }).click();

    // Verify Regular User is logged in and Admin button is NOT visible in Header
    await expect(page.getByRole('button', { name: 'Profile' })).toBeVisible();
    await expect(page.getByRole('button', { name: /🛡️ Admin/i })).not.toBeVisible();
    await page.screenshot({ path: 'screenshots/Regular_User_Login_Success.png' });
  });

  /* -------------------------------------------------------------------------- */
  /*                      W3-3: พัฒนาระบบสลับหน้าและนำทาง (Auth Navigation)         */
  /* -------------------------------------------------------------------------- */

  test('TC-I1-W3-3-001: การสลับไปหน้าเข้าสู่ระบบจากหน้า Register (Navigation to Login)', async ({ page }) => {
    await page.locator('header button').last().click();
    await page.getByRole('button', { name: 'New Trainer? Register' }).click();
    await expect(page.getByText('TRAINER REGISTRATION')).toBeVisible();

    await page.getByRole('button', { name: 'Already registered? Log In →' }).click();
    await expect(page.getByRole('heading', { name: 'Login to TravelCraft' })).toBeVisible();
    await page.screenshot({ path: 'screenshots/การสลับไปหน้าเข้าสู่ระบบจากหน้า Register.png' });
  });

  test('TC-I1-W3-3-002: การนำทางไปยังหน้า Register และ Forgot Password (Auth Navigation)', async ({ page }) => {
    await page.locator('header button').last().click();
    await expect(page.getByRole('heading', { name: 'Login to TravelCraft' })).toBeVisible();

    // Navigate to Forgot Password
    await page.getByRole('button', { name: 'Forgot Pass?' }).click();
    await expect(page.getByText('🔑 SYSTEM RECOVERY')).toBeVisible();

    // Navigate back to Login
    await page.getByRole('button', { name: '← Back to Login' }).click();
    await expect(page.getByRole('heading', { name: 'Login to TravelCraft' })).toBeVisible();

    // Navigate to Register
    await page.getByRole('button', { name: 'New Trainer? Register' }).click();
    await expect(page.getByText('TRAINER REGISTRATION')).toBeVisible();
    await page.screenshot({ path: 'screenshots/การนำทางไปยังหน้าRegister.png' });
  });

  /* -------------------------------------------------------------------------- */
  /*                      W3-4: พัฒนาระบบ Route Guard                             */
  /* -------------------------------------------------------------------------- */

  test('TC-I1-W3-4-001: ตรวจสอบการป้องกันการเข้าถึงหน้า Protected Page เมื่อยังไม่ได้ Login (Route Guard)', async ({ page }) => {
    // Navigating to Profile when not logged in shows Profile Locked route guard
    await page.getByRole('button', { name: 'Profile' }).click();
    await expect(page.getByText('Trainer Profile Locked')).toBeVisible();

    // Triggering auth required navigation leads to AuthPage login form
    await page.getByRole('button', { name: 'Log In Now' }).click();
    await expect(page.getByRole('heading', { name: 'Login to TravelCraft' })).toBeVisible();
    await page.screenshot({ path: 'screenshots/RouteGuard_ป้องกันหน้าProtected.png' });
  });

  test('TC-I1-W3-4-002: ตรวจสอบการป้องกัน Regular User ไม่ให้เข้าถึงหน้า Admin Command Center (Admin Route Protection)', async ({ page }) => {
    // Register & Login as regular user
    await page.locator('header button').last().click();
    await page.getByRole('button', { name: 'New Trainer? Register' }).click();

    const uniqueEmail = `guarded_user_${Date.now()}@pallettown.com`;
    await page.getByRole('textbox', { name: 'e.g. Ash K.' }).fill('Guarded User');
    await page.getByRole('textbox', { name: 'trainer@pallettown.com' }).fill(uniqueEmail);
    await page.getByRole('textbox', { name: '••••••••' }).first().fill('123456');
    await page.getByRole('textbox', { name: '••••••••' }).nth(1).fill('123456');
    await page.getByRole('button', { name: 'START ADVENTURE' }).click();

    // Verify Admin button is hidden from Header for regular user
    await expect(page.getByRole('button', { name: /🛡️ Admin/i })).not.toBeVisible();

    // Verify Profile page also does not show Admin Command Center button
    await page.getByRole('button', { name: 'Profile' }).click();
    await expect(page.getByRole('button', { name: /Open Command Center/i })).not.toBeVisible();
    await page.screenshot({ path: 'screenshots/Regular_User_Admin_Protected.png' });
  });

  /* -------------------------------------------------------------------------- */
  /*                      W3-5: ออกจากระบบ (Logout)                                */
  /* -------------------------------------------------------------------------- */

  test('TC-I1-W3-5-001: ออกจากระบบสำเร็จ (Logout Flow)', async ({ page }) => {
    // Login as Admin
    await page.locator('header button').last().click();
    await page.getByPlaceholder('your@email.com').fill('admin@travelcraft.com');
    await page.getByPlaceholder('••••••••').fill('123456');
    await page.getByRole('button', { name: 'Start Adventure / Enter Command' }).click();

    // Navigate to Profile and click Logout
    await page.getByRole('button', { name: 'Profile' }).click();
    await page.getByRole('button', { name: /Log Out Trainer Session/i }).click();

    // Verify redirected back to Auth Page
    await expect(page.getByRole('heading', { name: 'Login to TravelCraft' })).toBeVisible();
    await page.screenshot({ path: 'screenshots/Logout_Success.png' });
  });

});


