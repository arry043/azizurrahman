import { spawn } from "child_process";
import fs from "fs";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9225;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForChrome() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) return await res.json();
    } catch {}
    await sleep(200);
  }
  throw new Error("Chrome failed to start");
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.ws.close();
  }
}

async function waitForContent(client, text, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const res = await client.send("Runtime.evaluate", {
      expression: `document.body.innerText.includes(${JSON.stringify(text)})`,
    });
    if (res.result && res.result.value) return true;
    await sleep(250);
  }
  throw new Error(`Timeout waiting for text: ${text}`);
}

async function captureClip(client, selector, outputPath) {
  const res = await client.send("Runtime.evaluate", {
    expression: `
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          x: Math.max(0, rect.left + window.scrollX),
          y: Math.max(0, rect.top + window.scrollY),
          width: rect.width,
          height: rect.height,
        };
      })()
    `,
    returnByValue: true,
  });

  const rect = res.result?.value;
  if (!rect || rect.width <= 0 || rect.height <= 0) {
    console.warn(`Selector not found or 0-sized: ${selector}`);
    return false;
  }

  // Scroll element into view
  await client.send("Runtime.evaluate", {
    expression: `document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({ block: 'center' })`,
  });
  await sleep(300);

  // Recalculate viewport relative coordinates after scrolling
  const viewRes = await client.send("Runtime.evaluate", {
    expression: `
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        const rect = el.getBoundingClientRect();
        return {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        };
      })()
    `,
    returnByValue: true,
  });

  const vRect = viewRes.result.value;
  const clip = {
    x: Math.max(0, vRect.x),
    y: Math.max(0, vRect.y),
    width: vRect.width,
    height: vRect.height,
    scale: 2,
  };

  const ss = await client.send("Page.captureScreenshot", {
    format: "png",
    clip,
    captureBeyondViewport: false,
  });

  fs.writeFileSync(outputPath, Buffer.from(ss.data, "base64"));
  console.log(`Saved clip: ${outputPath}`);
  return true;
}

async function run() {
  const scratchDir = "/Users/arry03/Desktop/M Info Tech/azizurrahman/scratch";
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  const chromeProc = spawn(CHROME_PATH, [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
  ]);

  try {
    await waitForChrome();
    const targetsRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    const targets = await targetsRes.json();
    const pageTarget = targets.find((t) => t.type === "page") || targets[0];

    const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();
    await client.send("Page.enable");
    await client.send("DOM.enable");

    // 1. Desktop About Page - Scholar Portrait Card (Collarless & Arabic above English)
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 900,
      deviceScaleFactor: 2,
      mobile: false,
    });
    await client.send("Page.navigate", { url: "http://localhost:3000/about" });
    await waitForContent(client, "مولوی عزیز الرحمٰن");
    await sleep(1000); // Wait for images & fonts to load

    const aboutPortraitCaptured = await captureClip(
      client,
      ".scholar-portrait",
      `${scratchDir}/verified-scholar-portrait-desktop.png`,
    );
    if (!aboutPortraitCaptured) {
      // Fallback: capture page
      const ss = await client.send("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(`${scratchDir}/verified-about-desktop.png`, Buffer.from(ss.data, "base64"));
    }

    // 2. Mobile English Header (390x844) - Brand + Independent Language Switcher + Hamburger
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await client.send("Page.navigate", { url: "http://localhost:3000/" });
    await waitForContent(client, "AZIZURRAHMAN");
    await sleep(500);

    await captureClip(client, "header.site-header", `${scratchDir}/verified-mobile-header-en.png`);

    // Also capture the scholar portrait on mobile homepage
    await captureClip(
      client,
      ".scholar-portrait",
      `${scratchDir}/verified-scholar-portrait-mobile.png`,
    );

    // 3. Mobile Urdu Header (390x844)
    await client.send("Network.setCookie", {
      name: "azr_locale",
      value: "ur",
      domain: "localhost",
      path: "/",
    });
    await client.send("Page.navigate", { url: "http://localhost:3000/" });
    await waitForContent(client, "AZIZURRAHMAN");
    await sleep(500);

    await captureClip(client, "header.site-header", `${scratchDir}/verified-mobile-header-ur.png`);

    // 4. Footer WhatsApp Verification
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 900,
      deviceScaleFactor: 2,
      mobile: false,
    });
    await client.send("Network.deleteCookies", { name: "azr_locale", domain: "localhost" });
    await client.send("Page.navigate", { url: "http://localhost:3000/contact" });
    await waitForContent(client, "+918423668492");
    await sleep(500);

    await captureClip(client, "footer.site-footer", `${scratchDir}/verified-footer-whatsapp.png`);

    client.close();
    console.log("All visual verification captures completed successfully.");
  } finally {
    chromeProc.kill();
  }
}

run().catch((err) => {
  console.error("Verification run failed:", err);
  process.exit(1);
});
