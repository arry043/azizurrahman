import { spawn } from "child_process";
import fs from "fs";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9224;

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

async function waitForContent(client, text) {
  for (let i = 0; i < 40; i++) {
    const res = await client.send("Runtime.evaluate", {
      expression: `document.body && document.body.innerText.includes(${JSON.stringify(text)})`,
      returnByValue: true,
    });
    if (res.result?.value) {
      await sleep(400); // allow styles & animations to stabilize
      return;
    }
    await sleep(250);
  }
  console.warn(`Warning: timed out waiting for text "${text}"`);
}

async function run() {
  const scratchDir = "/Users/arry03/Desktop/M Info Tech/azizurrahman/scratch";
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  const chromeProc = spawn(
    CHROME_PATH,
    [
      "--headless=new",
      `--remote-debugging-port=${PORT}`,
      "--disable-gpu",
      "--no-sandbox",
      "--hide-scrollbars",
    ],
    { stdio: "ignore" },
  );

  try {
    await waitForChrome();
    const newPageRes = await fetch(`http://127.0.0.1:${PORT}/json/new`, { method: "PUT" });
    const page = await newPageRes.json();
    const client = new CDPClient(page.webSocketDebuggerUrl);
    await client.connect();

    await client.send("Page.enable");
    await client.send("Network.enable");

    // 1. Desktop English (1280x850)
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 900,
      deviceScaleFactor: 2,
      mobile: false,
    });
    await client.send("Network.setCookie", {
      name: "azr_locale",
      value: "en",
      domain: "localhost",
      path: "/",
    });
    await client.send("Page.navigate", { url: "http://localhost:3000/" });
    await waitForContent(client, "Select a Guidance Session");
    const ssDesktopEn = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(
      `${scratchDir}/new-hero-desktop-en.png`,
      Buffer.from(ssDesktopEn.data, "base64"),
    );
    console.log("Captured new-hero-desktop-en.png");

    // 2. Tablet English (768x950)
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 768,
      height: 950,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await client.send("Page.navigate", { url: "http://localhost:3000/" });
    await waitForContent(client, "Select a Guidance Session");
    const ssTabletEn = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(
      `${scratchDir}/new-hero-tablet-en.png`,
      Buffer.from(ssTabletEn.data, "base64"),
    );
    console.log("Captured new-hero-tablet-en.png");

    // 3. Mobile English (390x844)
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await client.send("Page.navigate", { url: "http://localhost:3000/" });
    await waitForContent(client, "Select a Guidance Session");
    const ssMobileEn = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(
      `${scratchDir}/new-hero-mobile-en.png`,
      Buffer.from(ssMobileEn.data, "base64"),
    );
    console.log("Captured new-hero-mobile-en.png");

    // 4. Desktop Urdu (1280x900)
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 900,
      deviceScaleFactor: 2,
      mobile: false,
    });
    await client.send("Network.setCookie", {
      name: "azr_locale",
      value: "ur",
      domain: "localhost",
      path: "/",
    });
    await client.send("Page.navigate", { url: "http://localhost:3000/" });
    await waitForContent(client, "مشاورتی نشست کا انتخاب کریں");
    const ssDesktopUr = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(
      `${scratchDir}/new-hero-desktop-ur.png`,
      Buffer.from(ssDesktopUr.data, "base64"),
    );
    console.log("Captured new-hero-desktop-ur.png");

    // 5. Mobile Urdu (390x844)
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await client.send("Page.navigate", { url: "http://localhost:3000/" });
    await waitForContent(client, "مشاورتی نشست کا انتخاب کریں");
    const ssMobileUr = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(
      `${scratchDir}/new-hero-mobile-ur.png`,
      Buffer.from(ssMobileUr.data, "base64"),
    );
    console.log("Captured new-hero-mobile-ur.png");

    client.close();
  } finally {
    chromeProc.kill();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
