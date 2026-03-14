<!-- Badges -->
[![Build Status](https://github.com/raymondotoo/Rays-Assistant/actions/workflows/main.yml/badge.svg)](https://github.com/raymondotoo/Rays-Assistant/actions)
[![License](https://img.shields.io/github/license/raymondotoo/Rays-Assistant?style=for-the-badge)](https://github.com/raymondotoo/Rays-Assistant/blob/main/LICENSE)
[![Latest Release](https://img.shields.io/github/v/release/raymondotoo/Rays-Assistant?style=for-the-badge)](https://github.com/raymondotoo/Rays-Assistant/releases)
[![Downloads](https://img.shields.io/github/downloads/raymondotoo/Rays-Assistant/total?style=for-the-badge)](https://github.com/raymondotoo/Rays-Assistant/releases)
[![Issues](https://img.shields.io/github/issues/raymondotoo/Rays-Assistant?style=for-the-badge)](https://github.com/raymondotoo/Rays-Assistant/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/raymondotoo/Rays-Assistant?style=for-the-badge)](https://github.com/raymondotoo/Rays-Assistant/pulls)
[![Code Style: Black](https://img.shields.io/badge/code%20style-black-000000.svg?style=for-the-badge)](https://github.com/psf/black)
[![Code Style: Prettier](https://img.shields.io/badge/code%20style-prettier-ff69b4.svg?style=for-the-badge)](https://prettier.io)

## Rays-Assistant

Rays-Assistant is a privacy-focused desktop app for interacting with multiple local LLMs. All models run entirely on your device—no cloud, no data sharing. Enjoy persistent learning, conversation history, and easy model switching with full control over your data.

## Dashboard Preview
![Rays-Assistant Dashboard](Rays%20LLM%20Dashboard.png)

## Download & Install

Choose the correct version for your Mac's processor.

| Processor | Download Link |
| :--- | :--- |
| **Apple Silicon** (M1, M2, M3, etc.) | [![Download for macOS (Apple Silicon)](https://img.shields.io/badge/Download-macOS%20Apple%20Silicon-blue?style=for-the-badge)](https://github.com/raymondotoo/Rays-Assistant/releases/latest/download/rays-llm-electron-1.0.0-arm64.dmg) |
| **Intel** | [![Download for macOS (Intel)](https://img.shields.io/badge/Download-macOS%20Intel-blue?style=for-the-badge)]
([https://github.com/raymondotoo/Rays-Assistant/releases/latest/download/rays-llm-electron-1.0.0-x64.dmg](https://github.com/raymondotoo/Rays-Assistant/releases/download/v1.0.3/rays-llm-electron-1.0.0.dmg)) |

**Installation Steps:**
1.  Download the correct `.dmg` file for your Mac.
2.  Open the `.dmg` file.
3.  Drag the `Rays-Assistant` app into your `Applications` folder.
4.  Launch the app from your Applications folder.

---

## System Requirements

-   **Operating System**: macOS 11 (Big Sur) or newer.
-   **Processor**: Apple Silicon (M-series) or Intel.
-   **RAM**: 8 GB minimum, 16 GB recommended.
-   **Disk Space**: ~15 GB of free space is recommended to store the AI models.

---

## Dependencies

This application requires two key dependencies to be installed on your system.

### 1. Ollama

Rays-Assistant uses **Ollama** to run AI models locally. You must install it before using the app.

-   **Download and install Ollama from the official website**.

The app will attempt to detect and start Ollama for you, but it's best to have it installed and running first.

### 2. AI Models

The app uses several AI models (like Mistral, Neural-Chat, etc.). On first launch, the app will check which models you have and will prompt you to download any that are missing.

-   **Total Download Size**: ~12.3 GB for the default set of models.
-   The download will happen in the background. Once complete, the app will ask you to refresh to begin using the new models.

---

## Troubleshooting

### "App is damaged and can’t be opened" Error

This is a standard macOS security feature called Gatekeeper. If you see this message, it means the app is not yet notarized by Apple. You can bypass this in two ways:

**Method 1: The Easy Way (Recommended)**

1.  Go to your `Applications` folder.
2.  **Right-click** (or `Ctrl`-click) on the `Rays-Assistant` app.
3.  Select **Open** from the context menu.
4.  A dialog will appear with a warning. Click the **Open** button to run the app. You only need to do this once.

**Method 2: The Terminal Way**

If the above method doesn't work, you can manually remove the quarantine attribute from the app.

1.  Open the `Terminal` app.
2.  Run the following command:
    ```bash
    sudo xattr -rd com.apple.quarantine /Applications/Rays-Assistant.app
    ```
3.  Enter your password when prompted. The app should now open normally.

---

## For Developers

Interested in contributing or building the app from the source code? Please see the **Developer Guide** for detailed instructions.
