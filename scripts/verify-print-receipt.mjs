import { spawn } from "child_process";
import fs from "fs";
import http from "http";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9222;

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

async function run() {
  const scratchDir =
    "/Users/arry03/.gemini/antigravity/brain/315555cb-6d4f-494a-85d7-a6bd203df2c2/scratch";
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  console.log("Launching Headless Chrome on port " + PORT + "...");
  const chromeProc = spawn(CHROME_PATH, [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    "--disable-gpu",
    "--no-sandbox",
    "--window-size=1200,900",
  ]);

  try {
    await waitForChrome();
    console.log("Chrome CDP ready!");

    // Create a new tab
    const tabRes = await fetch(`http://127.0.0.1:${PORT}/json/new`, { method: "PUT" });
    const tab = await tabRes.json();
    const client = new CDPClient(tab.webSocketDebuggerUrl);
    await client.connect();

    await client.send("Page.enable");
    await client.send("DOM.enable");
    await client.send("CSS.enable");
    await client.send("Network.enable");

    // Test cases: English and Urdu on /appointments/AZR-5NF7M-Q1EMB
    const testCases = [
      {
        name: "Receipt-English",
        locale: "en",
        url: "http://localhost:3000/appointments/AZR-5NF7M-Q1EMB",
      },
      {
        name: "Receipt-Urdu",
        locale: "ur",
        url: "http://localhost:3000/appointments/AZR-5NF7M-Q1EMB",
      },
    ];

    for (const tc of testCases) {
      console.log(`\nTesting ${tc.name} (${tc.locale})...`);

      // Set cookie
      await client.send("Network.setCookie", {
        name: "azr_locale",
        value: tc.locale,
        domain: "localhost",
        path: "/",
      });

      // Navigate
      await client.send("Page.navigate", { url: tc.url });
      await sleep(1500);

      // Emulate print media
      await client.send("Emulation.setEmulatedMedia", { media: "print" });
      await sleep(500);

      // Inspect visibility of elements in print mode
      const evalResult = await client.send("Runtime.evaluate", {
        expression: `(() => {
          const header = document.querySelector('header');
          const footer = document.querySelector('footer');
          const receipt = document.querySelector('.appointment-receipt-print');
          const actionButtons = document.querySelector('.receipt-no-print');
          const bdiRef = document.querySelector('.appointment-receipt-print bdi');

          const isVisible = (el) => {
            if (!el) return false;
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
          };

          return {
            headerHidden: !isVisible(header),
            footerHidden: !isVisible(footer),
            receiptVisible: isVisible(receipt),
            actionButtonsHidden: !isVisible(actionButtons),
            receiptHeightPx: receipt ? receipt.offsetHeight : 0,
            referenceText: bdiRef ? bdiRef.textContent.trim() : null,
            htmlLang: document.documentElement.lang,
            htmlDir: document.documentElement.dir
          };
        })()`,
        returnByValue: true,
      });

      console.log("DOM Print Evaluation:", evalResult.result.value);

      // Take Screenshot of the receipt element in print media
      const clipBox = await client.send("Runtime.evaluate", {
        expression: `(() => {
          const r = document.querySelector('.appointment-receipt-print');
          if (!r) return { x: 0, y: 0, width: 800, height: 1000 };
          const rect = r.getBoundingClientRect();
          return {
            x: Math.max(0, Math.floor(rect.x) - 10),
            y: Math.max(0, Math.floor(rect.y) - 10),
            width: Math.ceil(rect.width) + 20,
            height: Math.ceil(rect.height) + 20
          };
        })()`,
        returnByValue: true,
      });

      const screenshot = await client.send("Page.captureScreenshot", {
        format: "png",
        clip: { ...clipBox.result.value, scale: 1 },
      });
      const imgPath = `${scratchDir}/${tc.name}.png`;
      fs.writeFileSync(imgPath, Buffer.from(screenshot.data, "base64"));
      console.log(`Saved print screenshot: ${imgPath}`);

      // Generate PDF
      const pdf = await client.send("Page.printToPDF", {
        paperWidth: 8.27, // A4 inches (210mm)
        paperHeight: 11.69, // A4 inches (297mm)
        marginTop: 0.4, // ~10mm
        marginBottom: 0.4,
        marginLeft: 0.5, // ~12mm
        marginRight: 0.5,
        printBackground: true,
      });

      const pdfPath = `${scratchDir}/${tc.name}.pdf`;
      fs.writeFileSync(pdfPath, Buffer.from(pdf.data, "base64"));
      const pdfText = Buffer.from(pdf.data, "base64").toString("latin1");
      const pageCount = (pdfText.match(/\/Type\s*\/Page\b/g) || []).length;
      console.log(`Saved PDF: ${pdfPath} (Page count: ${pageCount})`);
    }

    client.close();
  } finally {
    chromeProc.kill("SIGKILL");
  }
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
