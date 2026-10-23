import { spawn } from "child_process";
import fs from "fs";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9227;

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

async function run() {
  const scratchDir = "/Users/arry03/Desktop/M Info Tech/azizurrahman/scratch";
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

    // 1. Desktop About Page English
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 2400,
      deviceScaleFactor: 2,
      mobile: false,
    });
    await client.send("Network.deleteCookies", { name: "azr_locale", domain: "localhost" });
    await client.send("Page.navigate", { url: "http://localhost:3000/about" });
    await waitForContent(client, "Kharewan");
    await sleep(1000);

    const rectResEn = await client.send("Runtime.evaluate", {
      expression: `
        (() => {
          const el = document.querySelector(".scholar-portrait");
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { x: r.left, y: r.top, width: r.width, height: r.height };
        })()
      `,
      returnByValue: true,
    });

    const rEn = rectResEn.result?.value;
    if (rEn) {
      const clipEn = {
        x: Math.max(0, rEn.x - 20),
        y: Math.max(0, rEn.y - 20),
        width: rEn.width + 40,
        height: rEn.height + 40,
        scale: 2,
      };

      const ssEn = await client.send("Page.captureScreenshot", {
        format: "png",
        clip: clipEn,
        captureBeyondViewport: true,
      });

      fs.writeFileSync(
        `${scratchDir}/verified-scholar-portrait-en.png`,
        Buffer.from(ssEn.data, "base64"),
      );
      console.log("Captured verified-scholar-portrait-en.png");
    }

    // 2. Desktop About Page Urdu
    await client.send("Network.setCookie", {
      name: "azr_locale",
      value: "ur",
      domain: "localhost",
      path: "/",
    });
    await client.send("Page.navigate", { url: "http://localhost:3000/about" });
    await waitForContent(client, "کھریواں");
    await sleep(1000);

    const rectResUr = await client.send("Runtime.evaluate", {
      expression: `
        (() => {
          const el = document.querySelector(".scholar-portrait");
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { x: r.left, y: r.top, width: r.width, height: r.height };
        })()
      `,
      returnByValue: true,
    });

    const rUr = rectResUr.result?.value;
    if (rUr) {
      const clipUr = {
        x: Math.max(0, rUr.x - 20),
        y: Math.max(0, rUr.y - 20),
        width: rUr.width + 40,
        height: rUr.height + 40,
        scale: 2,
      };

      const ssUr = await client.send("Page.captureScreenshot", {
        format: "png",
        clip: clipUr,
        captureBeyondViewport: true,
      });

      fs.writeFileSync(
        `${scratchDir}/verified-scholar-portrait-ur.png`,
        Buffer.from(ssUr.data, "base64"),
      );
      console.log("Captured verified-scholar-portrait-ur.png");
    }

    client.close();
  } finally {
    chromeProc.kill();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
