from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 900})

    # Go to login
    page.goto('http://localhost:3000/login')
    page.wait_for_load_state('networkidle')

    # Fill login form
    page.fill('#nationalId', '0000000000')
    page.fill('#password', 'admin123')
    page.click('button[type="submit"]')

    # Wait for dashboard
    page.wait_for_url('**/dashboard')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1000)

    # Screenshot dashboard
    page.screenshot(path='/tmp/dashboard.png', full_page=True)
    print("Dashboard screenshot saved")

    browser.close()
