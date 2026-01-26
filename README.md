# Grok Imagine Loop Extension (Firefox)

This is a **Firefox** port of the [Grok Imagine Loop Chrome Extension](https://github.com/allophylus/grok-imagine-loop) (v1.6).

A browser extension to automate video generation loops on [Grok.com](https://grok.com). This tool allows you to create seamless video sequences by automatically using the last frame of a generated video as the input for the next generation, creating a continuous "flow" effect.

## Features

*   **🔄 Auto-Looping (Scenes):** Automatically chains video generations. Define how many "Scenes" you want for your story.
*   **🖼️ Smart Frame Extraction:** Extracts the last frame of a video to use as the start of the next one.
- **Global Suffix:** Define a shared style prompt (e.g., "photorealistic") that is automatically appended to every scene.
- **Pause After Video:** Optional "Step Mode" to pause the loop after each generation, allowing for manual review and adjustments.
*   **⚡ Upscale Support:** Check "Upscale Result" to automatically request the High Quality version of each video.
*   **📥 Auto-Download:** Automatically saves each generated segment to your Downloads folder.
*   **💾 State Persistence:**
    *   **Input Saving:** Your Prompts, Scene counts, and settings are saved automatically.
    *   **Config Presets:** Save and load multiple "Loops" (Settings + Scenes) for easy reuse.
*   **⇱ Sidebar Workflow:**
    *   **Native Integration:** Runs directly in the Firefox Sidebar for a seamless experience.
    *   **Optional Dashboard:** Toggle the floating on-page overlay if you prefer a clean view.
*   **🌍 Multi-Language Support:** Works with Grok in English, Spanish, French, German, Chinese, Japanese, Russian, and Portuguese.
*   **🛡️ Anti-Bot Protection:** 
    *   **Fast Human-Like Input:** Randomized timing but optimized for speed (Paste-like insertion).
    *   **Randomized Delays:** Unpredictable wait times to mimic human behavior.
*   **🧪 A/B Test Handling:** Automatically detects and skips the "Which video do you prefer?" survey popup in all supported languages.
*   **⚙️ Advanced Settings:**
    *   **Strict Mode:** Force "Enter Key" submission if button clicks are inconsistent.
    *   **Skip on Moderation:** Option to automatically skip prompts that trigger content flags instead of pausing.
*   **🛠️ Full Control:** 
    *   **Regenerate:** Retry any specific segment directly from the list.
    *   **Resume with Edits:** Edit future prompts while paused, then resume to apply changes dynamically.
    *   **Global Suffix:** Apply a common style or instruction to *every* scene automatically (e.g. "cinematic lighting").

## Installation (Firefox)

1.  **Download the Code:**
    *   Clone this repository or download the ZIP file and extract it.
2.  **Open Debugging Page:**
    *   Open Firefox.
    *   Navigate to `about:debugging` (enter this in the URL bar).
    *   Click on **"This Firefox"** in the left sidebar.
3.  **Load Temporary Add-on:**
    *   Click the **"Load Temporary Add-on..."** button.
    *   Navigate to the `grok-extension-firefox` folder and select the `manifest.json` file.
4.  **Access the Extension:**
    *   The extension icon will appear in your toolbar.
    *   You can also access it via **View → Sidebar → Grok Imagine Loop**.

## Usage

1.  **Open Grok:**
    *   Go to [Grok.com](https://grok.com) or the Grok tab on X.com.
2.  **Launch the Extension:**
    *   Click the extension icon in your toolbar.
    *   *Optional:* Click the `⇱` button to pop the controller out into its own window.
3.  **Configure Your Loop:**
    *   **Initial Image (Optional):** Upload a starting image to begin your story on a specific frame.
    *   **Prompts:** Enter your video prompts, one per line.
    *   **Scenes:** How many times to cycle through the prompts.
    *   **Timeout:** Max time to wait for generation (default 120s).
    *   **Upscale Result:** Enable to wait for and capture the High Quality version.
    *   **Auto-Download:** Enable to save every video segment automatically.
4.  **Start:**
    *   Click **Start Generation**.
    *   The "Grok Loop" dashboard will appear on the page.


**Tips:**
*   Use the **Pause** button on the dashboard if you need to inspect a video.
*   Use **Reset Inputs** at the bottom of the popup to clear all saved settings and images.

## Performance & Troubleshooting

### Loop Pausing / Slowing Down in Background
If the extension stops or runs very slowly when you switch tabs, you may be hitting **Firefox's Background Tab Throttling**. This is a browser feature to save battery.

**Solutions:**
1.  **Keep the Tab Visible:** Drag the Grok tab into its own separate window so it remains "visible" on your screen, even if behind other windows.
2.  **Disable Throttling (Advanced):** In `about:config`, you can adjust `dom.min_background_timeout_value` to reduce throttling for background tabs.

## Support

If you find this tool useful, consider buying me a coffee!

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/mrdom78)

## Reporting Issues

Please report any issue here. Please include the following information when reporting issues:

1.  **Screenshot** of your full desktop (including the Grok Imagine page and the extension panel).
2.  **Export the log**:
    *   Enable logs under **Settings** > **Show Debug Logs**.
    *   Replicate the issue.
    *   Go to **Main** tab.
    *   Click **Download** next to Debug Logs.
3.  **Operating System** (e.g. Ubuntu 24.04 LTS, macOS Sequoia).
4.  **Browser** (e.g. Firefox Developer Edition, Firefox Nightly).
5.  **Grok Interface Language** (e.g. English, German).

## 🚧 Roadmap / Work in Progress
*   **Active Development:** Multi-Language Support (Expanding translations for specific UI variations).
*   **TODO:** Ensure all popups are always on top.
*   **TODO:** Fix persistence/storage optimization.

## Disclaimer

This is a third-party extension and is not affiliated with xAI or Grok. Use responsibly and adhere to the platform's terms of service.

> [!CAUTION]
> **Use at your own risk.** Automated interactions may be flagged as bot activity by Grok/xAI. Excessive or unnatural usage patterns could lead to rate limits, account suspension, or IP bans. The authors of this extension are not responsible for any actions taken against your account.
