import { test, expect } from '@playwright/test';

test.describe('Pocket Odyssey - Core Features & Community Module', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
  });

  /* -------------------------------------------------------------------------- */
  /*               W4-1: ระบบสำรวจและค้นหาแผนที่ชุมชน (Community Features)        */
  /* -------------------------------------------------------------------------- */

  test('TC-I1-W4-1-001: ค้นหาแผนที่ใน Community ด้วยคำค้นหา (Search Map by Keyword - Happy Path)', async ({ page }) => {
    // Navigate to Community Page
    await page.getByRole('button', { name: 'Community Discoveries' }).click();
    await expect(page.getByRole('heading', { name: 'COMMUNITY DISCOVERIES' })).toBeVisible();

    // Type search keyword
    const searchInput = page.getByPlaceholder('SEARCH DESTINATIONS...');
    await searchInput.fill('Grand Canyon');

    // Verify filtered results
    await expect(page.getByRole('heading', { name: 'GRAND CANYON' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'EIFFEL TOWER' })).not.toBeVisible();
    await page.screenshot({ path: 'screenshots/Community_Search_Success.png' });
  });

  test('TC-I1-W4-1-002: กรองแผนที่ตามหมวดหมู่ (Category Filter - Nature, Urban, All)', async ({ page }) => {
    await page.getByRole('button', { name: 'Community Discoveries' }).click();
    await expect(page.getByRole('heading', { name: 'COMMUNITY DISCOVERIES' })).toBeVisible();

    // Filter by NATURE
    await page.getByRole('button', { name: 'NATURE' }).click();
    await expect(page.getByRole('heading', { name: 'GRAND CANYON' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'AKIHABARA NEON' })).not.toBeVisible();

    // Filter by URBAN
    await page.getByRole('button', { name: 'URBAN' }).click();
    await expect(page.getByRole('heading', { name: 'AKIHABARA NEON' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'GRAND CANYON' })).not.toBeVisible();

    // Reset to ALL
    await page.getByRole('button', { name: 'ALL' }).click();
    await expect(page.getByRole('heading', { name: 'GRAND CANYON' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'AKIHABARA NEON' })).toBeVisible();
    await page.screenshot({ path: 'screenshots/Community_Category_Filter.png' });
  });

  test('TC-I1-W4-1-003: ค้นหาแผนที่ด้วยคำค้นหาที่ไม่พบในระบบ (Search Not Found - Negative Case)', async ({ page }) => {
    await page.getByRole('button', { name: 'Community Discoveries' }).click();
    await expect(page.getByRole('heading', { name: 'COMMUNITY DISCOVERIES' })).toBeVisible();

    // Type non-existent query
    const searchInput = page.getByPlaceholder('SEARCH DESTINATIONS...');
    await searchInput.fill('NON_EXISTENT_DESTINATION_999');

    // Verify all cards are hidden
    await expect(page.getByRole('heading', { name: 'EIFFEL TOWER' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'GRAND CANYON' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'AKIHABARA NEON' })).not.toBeVisible();
    await page.screenshot({ path: 'screenshots/Community_Search_Not_Found.png' });
  });

  test('TC-I1-W4-1-004: ดูรายละเอียดแผนที่จาก Community Page (View Map Details Navigation)', async ({ page }) => {
    await page.getByRole('button', { name: 'Community Discoveries' }).click();
    await expect(page.getByRole('heading', { name: 'COMMUNITY DISCOVERIES' })).toBeVisible();

    // Search specifically for Eiffel Tower to ensure deterministic card selection
    await page.getByPlaceholder('SEARCH DESTINATIONS...').fill('Eiffel Tower');
    await expect(page.getByRole('heading', { name: 'EIFFEL TOWER' })).toBeVisible();

    // Click "VIEW DETAILS" on the Eiffel Tower card
    await page.getByRole('button', { name: 'VIEW DETAILS' }).click();

    // Verify navigation to Details page
    await expect(page.getByRole('button', { name: 'Back to World Map' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Eiffel Tower/i })).toBeVisible();
    await page.screenshot({ path: 'screenshots/Community_View_Details.png' });
  });

  /* -------------------------------------------------------------------------- */
  /*            W4-2: ระบบแผนที่โลกและการติดตาม (World Map & Tracking)             */
  /* -------------------------------------------------------------------------- */

  test('TC-I1-W4-2-001: ติดตามแผนที่บน World Map จาก Community Card (Track on Map Flow)', async ({ page }) => {
    await page.getByRole('button', { name: 'Community Discoveries' }).click();
    await expect(page.getByRole('heading', { name: 'COMMUNITY DISCOVERIES' })).toBeVisible();

    // Search and track Grand Canyon
    await page.getByPlaceholder('SEARCH DESTINATIONS...').fill('Grand Canyon');
    await page.getByRole('button', { name: 'TRACK ON MAP' }).click();

    // Verify redirected to World Map with title
    await expect(page.getByRole('heading', { name: 'GRAND CANYON' })).toBeVisible();
    // Verify Header World Map button now exists
    await expect(page.getByRole('button', { name: /World Map/i })).toBeVisible();
    await page.screenshot({ path: 'screenshots/WorldMap_Track_Success.png' });
  });

  test('TC-I1-W4-2-002: ตรวจสอบการทำงานของปุ่ม Zoom Controls บน World Map (Zoom Controls)', async ({ page }) => {
    // Track a map first to enter World Map
    await page.getByRole('button', { name: 'Community Discoveries' }).click();
    await expect(page.getByRole('heading', { name: 'COMMUNITY DISCOVERIES' })).toBeVisible();
    await page.getByPlaceholder('SEARCH DESTINATIONS...').fill('Grand Canyon');
    await page.getByRole('button', { name: 'TRACK ON MAP' }).click();

    // Check Zoom In, Zoom Out, and Reset Zoom buttons are present and clickable
    const zoomInBtn = page.getByRole('button', { name: 'Zoom In' });
    const zoomOutBtn = page.getByRole('button', { name: 'Zoom Out' });
    const resetZoomBtn = page.getByRole('button', { name: 'Reset Zoom' });

    await expect(zoomInBtn).toBeVisible();
    await expect(zoomOutBtn).toBeVisible();
    await expect(resetZoomBtn).toBeVisible();

    await zoomInBtn.click();
    await zoomOutBtn.click();
    await resetZoomBtn.click();
    await page.screenshot({ path: 'screenshots/WorldMap_Zoom_Controls.png' });
  });

  /* -------------------------------------------------------------------------- */
  /*             W4-3: ระบบนำทางหน้าแรกและแบรนด์ (Home Page Navigation)            */
  /* -------------------------------------------------------------------------- */

  test('TC-I1-W4-3-001: นำทางจาก Hero Section หน้าแรกไปยัง Community Page (Home Explore CTA)', async ({ page }) => {
    // Click Explore Community Maps button in Hero banner
    const exploreBtn = page.getByRole('button', { name: 'Explore Community Maps' });
    await expect(exploreBtn).toBeVisible();
    await exploreBtn.click();

    // Verify redirected to Community Page
    await expect(page.getByRole('heading', { name: 'COMMUNITY DISCOVERIES' })).toBeVisible();
    await page.screenshot({ path: 'screenshots/Home_Explore_CTA_Navigation.png' });
  });

  test('TC-I1-W4-3-002: ตรวจสอบการคลิกโลโก้ TravelCraft เพื่อกลับมายังหน้าแรก (Logo Return to Home)', async ({ page }) => {
    // Navigate away from home
    await page.getByRole('button', { name: 'Community Discoveries' }).click();
    await expect(page.getByRole('heading', { name: 'COMMUNITY DISCOVERIES' })).toBeVisible();

    // Click Header Logo
    await page.locator('header').getByText('TravelCraft', { exact: true }).click();

    // Verify returned to Home page
    await expect(page.getByRole('heading', { name: /Gotta/i })).toBeVisible();
    await expect(page.getByText(/THE CORE GAMEPLAY LOOP/i)).toBeVisible();
    await page.screenshot({ path: 'screenshots/Logo_Return_To_Home.png' });
  });

  /* -------------------------------------------------------------------------- */
  /*            W4-4: การตั้งค่าภาษาและโหมดการแสดงผล (Settings & Theme)            */
  /* -------------------------------------------------------------------------- */

  test('TC-I1-W4-4-001: สลับ Theme ระหว่าง Light Mode และ Dark Mode (Theme Toggle)', async ({ page }) => {
    // Login as Admin to access Settings
    await page.locator('header button').last().click();
    await page.getByPlaceholder('your@email.com').fill('admin@travelcraft.com');
    await page.getByPlaceholder('••••••••').fill('123456');
    await page.getByRole('button', { name: 'Start Adventure / Enter Command' }).click();

    // Open Settings
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    // Switch to Dark Mode
    await page.getByRole('button', { name: 'Dark Mode' }).click();
    await expect(page.locator('div.dark')).toBeVisible();

    // Switch to Light Mode
    await page.getByRole('button', { name: 'Light Mode' }).click();
    await expect(page.locator('div.dark')).not.toBeVisible();
    await page.screenshot({ path: 'screenshots/Settings_Theme_Toggle.png' });
  });

  test('TC-I1-W4-4-002: เปลี่ยนภาษาของระบบเป็นภาษาไทย (Language Switcher Localization)', async ({ page }) => {
    // Login as Admin
    await page.locator('header button').last().click();
    await page.getByPlaceholder('your@email.com').fill('admin@travelcraft.com');
    await page.getByPlaceholder('••••••••').fill('123456');
    await page.getByRole('button', { name: 'Start Adventure / Enter Command' }).click();

    // Open Settings
    await page.getByRole('button', { name: 'Settings' }).click();

    // Select Thai language
    await page.getByRole('button', { name: /ไทย/i }).click();

    // Verify Header navigation buttons updated to Thai
    await expect(page.getByRole('button', { name: 'หน้าแรก' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'สถานที่ค้นพบจากชุมชน' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'โปรไฟล์' })).toBeVisible();
    await page.screenshot({ path: 'screenshots/Settings_Language_Switch_Thai.png' });
  });

  /* -------------------------------------------------------------------------- */
  /*           W4-5: แผนที่ของฉันและการป้องกันสิทธิ์ (My Maps & Protected Form)     */
  /* -------------------------------------------------------------------------- */

  test('TC-I1-W4-5-001: ป้องกันผู้ใช้ที่ยังไม่ได้ Login เมื่อกดปุ่ม Create New Map (Protected Map Creation)', async ({ page }) => {
    // Navigate to My Maps as guest
    await page.getByRole('button', { name: 'My Maps' }).click();
    await expect(page.getByRole('heading', { name: 'My Custom Maps' })).toBeVisible();

    // Click Create New Map button
    await page.getByRole('button', { name: 'Create New Map' }).click();

    // Verify redirection to Auth/Login page
    await expect(page.getByRole('heading', { name: 'Login to TravelCraft' })).toBeVisible();
    await page.screenshot({ path: 'screenshots/MyMaps_Guest_Creation_Protected.png' });
  });

  test('TC-I1-W4-5-002: ผู้ใช้ที่เข้าสู่ระบบแล้วสามารถเปิด Modal สร้างแผนที่ใหม่ได้ (Authenticated Create Map Modal)', async ({ page }) => {
    // Login as Admin
    await page.locator('header button').last().click();
    await page.getByPlaceholder('your@email.com').fill('admin@travelcraft.com');
    await page.getByPlaceholder('••••••••').fill('123456');
    await page.getByRole('button', { name: 'Start Adventure / Enter Command' }).click();

    // Navigate to My Maps
    await page.getByRole('button', { name: 'My Maps' }).click();
    await expect(page.getByRole('heading', { name: 'My Custom Maps' })).toBeVisible();

    // Click Create New Map button
    await page.getByRole('button', { name: 'Create New Map' }).click();

    // Verify Create Map Form modal opens
    await expect(page.getByRole('button', { name: /Create Map/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await page.screenshot({ path: 'screenshots/MyMaps_Create_Modal_Opened.png' });
  });

});
