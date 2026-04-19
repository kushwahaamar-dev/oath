import os

from playwright.sync_api import sync_playwright


BASE = os.environ.get("BASE_URL", "http://127.0.0.1:3000")


def record(page, path: str) -> None:
    page.wait_for_load_state("networkidle")
    page.screenshot(path=path, full_page=True)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1200})
    page.goto(BASE, wait_until="networkidle")
    record(page, "/tmp/halo-landing-desktop.png")
    print(
        "landing_headline="
        f"{page.get_by_role('heading', name='Bind intent before action.').is_visible()}"
    )
    print(f"landing_canvas={page.locator('canvas').count()}")

    page.goto(f"{BASE}/dashboard", wait_until="networkidle")
    record(page, "/tmp/halo-dashboard-desktop.png")
    print(
        "dashboard_title="
        f"{page.get_by_role('heading', name='Live oath ledger.').is_visible()}"
    )
    print(
        "dashboard_ledger="
        f"{page.get_by_role('heading', name='Recorded mandates').is_visible()}"
    )
    print(f"dashboard_canvas={page.locator('canvas').count()}")
    browser.close()

    reduced_browser = p.chromium.launch(headless=True)
    reduced_context = reduced_browser.new_context(
        viewport={"width": 1440, "height": 1200},
        reduced_motion="reduce",
    )
    reduced_page = reduced_context.new_page()
    reduced_page.goto(BASE, wait_until="networkidle")
    record(reduced_page, "/tmp/halo-landing-reduced.png")
    print(
        "reduced_fallback="
        f"{reduced_page.get_by_text('Reduced motion mode enabled.').is_visible()}"
    )
    print(f"reduced_canvas={reduced_page.locator('canvas').count()}")
    reduced_browser.close()

    mobile_browser = p.chromium.launch(headless=True)
    mobile_context = mobile_browser.new_context(
        viewport={"width": 390, "height": 844},
        is_mobile=True,
        has_touch=True,
    )
    mobile_page = mobile_context.new_page()
    mobile_page.goto(f"{BASE}/chat", wait_until="networkidle")
    record(mobile_page, "/tmp/halo-chat-mobile.png")
    print(
        "chat_chamber="
        f"{mobile_page.get_by_role('heading', name='Oath Chamber').first.is_visible()}"
    )
    print(f"chat_request_label={mobile_page.get_by_text('Your request').is_visible()}")
    mobile_browser.close()

    no_webgl_browser = p.chromium.launch(headless=True, args=["--disable-webgl"])
    no_webgl_page = no_webgl_browser.new_page(viewport={"width": 1440, "height": 1200})
    no_webgl_page.goto(BASE, wait_until="networkidle")
    record(no_webgl_page, "/tmp/halo-landing-no-webgl.png")
    print(
        "no_webgl_fallback="
        f"{no_webgl_page.get_by_text('WebGL fallback loaded.').is_visible()}"
    )
    print(f"no_webgl_canvas={no_webgl_page.locator('canvas').count()}")
    print(f"no_webgl_headline={no_webgl_page.get_by_text('Bind intent before action.').is_visible()}")
    no_webgl_browser.close()
