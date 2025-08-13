import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        main_page = await context.new_page()

        # Navigate to the main application page
        await main_page.goto("http://localhost:8000/index.html")

        # Bypass the login screen for the test
        await main_page.evaluate("() => document.getElementById('loginOverlay').style.display = 'none'")
        await main_page.evaluate("() => document.getElementById('startRpgBtn').disabled = false")
        await main_page.evaluate("() => document.getElementById('character-sheet').style.display = 'block'")

        # Listen for the new page to open
        async with context.expect_page() as new_page_info:
            await main_page.locator("#startRpgBtn").click()

        rpg_page = await new_page_info.value
        await rpg_page.wait_for_load_state()

        # --- On the RPG Page ---
        await rpg_page.get_by_role("button", name="Neues Spiel").click()
        await expect(rpg_page.get_by_role("heading", name="Wähle deine Klasse")).to_be_visible()

        # Select the Warrior
        krieger_card = rpg_page.locator(".character-card", has_text="Krieger")
        await expect(krieger_card).to_be_visible()

        # Click the "Übernehmen" button on the card
        await krieger_card.locator(".btn-apply-char").click()

        # Verify the naming modal appears
        naming_modal = rpg_page.locator("#name-char-modal")
        await expect(naming_modal).to_be_visible()

        # Enter a name and confirm
        await naming_modal.locator("#predef-char-name-input").fill("Jules the Robust")
        await naming_modal.locator("#confirm-predef-name-btn").click()

        # --- Back on the Main Page ---
        # The test will now implicitly wait for the UI to update,
        # as expect() has a built-in timeout. This is more robust than a fixed timeout.

        # Assert the name, portrait, stats, and button text have all updated
        await expect(main_page.locator("#char-name")).to_have_text("Jules the Robust")
        await expect(main_page.locator("#char-portrait")).to_have_attribute("src", "/images/RPG/Krieger.png")
        await expect(main_page.locator("#charStrength")).to_have_text("8")
        await expect(main_page.locator("#charDexterity")).to_have_text("4")
        await expect(main_page.locator("#charIntelligence")).to_have_text("3")
        await expect(main_page.locator("#startRpgBtn")).to_have_text("Spiel fortsetzen")

        # Take a screenshot of the main page
        await main_page.screenshot(path="jules-scratch/verification/robust_flow.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
