import time, urllib.request
from playwright.sync_api import sync_playwright

# Wait for server
for i in range(30):
    try:
        urllib.request.urlopen('http://localhost:3000', timeout=2)
        print(f"Server ready after {i+1}s")
        break
    except: time.sleep(1)

pw = sync_playwright().start()
browser = pw.chromium.launch(headless=True)
page = browser.new_page(viewport={"width": 1280, "height": 900})
page.set_default_timeout(60000)

page.goto('http://localhost:3000/login')
page.wait_for_selector('#nationalId', timeout=30000)
page.fill('#nationalId', '0000000000')
page.fill('#password', 'admin123')
page.click('button[type="submit"]')
page.wait_for_url('**/dashboard', timeout=30000)
page.wait_for_timeout(2000)
print("Logged in")

page.goto('http://localhost:3000/occ')
page.wait_for_timeout(3000)
page.screenshot(path='/tmp/occ.png', full_page=True)
print("OCC done")

page.goto('http://localhost:3000/pa')
page.wait_for_timeout(3000)
page.screenshot(path='/tmp/pa.png', full_page=True)
print("PA done")

page.goto('http://localhost:3000/ai')
page.wait_for_timeout(3000)
page.screenshot(path='/tmp/ai.png', full_page=True)
print("AI done")

browser.close()
pw.stop()
