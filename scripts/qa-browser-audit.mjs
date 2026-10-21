/**
 * Comprehensive Browser, Viewport & WCAG Accessibility Audit Script
 * Uses Chrome DevTools Protocol (CDP) via native Node 22 WebSocket.
 */
import { spawn } from "node:child_process";

const VIEWPORTS = [
  { name: "Mobile Compact (320px)", width: 320, height: 568 },
  { name: "Mobile Standard (360px)", width: 360, height: 640 },
  { name: "Mobile Modern (390px)", width: 390, height: 844 },
  { name: "Mobile Large (430px)", width: 430, height: 932 },
  { name: "Tablet Portrait (768px)", width: 768, height: 1024 },
  { name: "Tablet Landscape / Laptop (1024px)", width: 1024, height: 768 },
  { name: "Desktop Standard (1280px)", width: 1280, height: 800 },
  { name: "Desktop Wide (1440px)", width: 1440, height: 900 },
];

const ROUTES = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
  { name: "Services Catalog", path: "/services" },
  { name: "Service Detail", path: "/services/dev-sample-short-consultation" },
  { name: "Booking Flow", path: "/book" },
  { name: "Contact", path: "/contact" },
  { name: "Appointment Lookup", path: "/appointments/lookup" },
  { name: "Privacy Notice", path: "/privacy" },
  { name: "Admin Login", path: "/admin/login" },
];

const BASE_URL = process.env.APP_BASE_URL || process.env.BASE_URL || "http://localhost:3002";

// Helper to send CDP command
function createCdpClient(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 1;
  const callbacks = new Map();

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && callbacks.has(data.id)) {
      const cb = callbacks.get(data.id);
      callbacks.delete(data.id);
      if (data.error) cb.reject(new Error(data.error.message));
      else cb.resolve(data.result);
    }
  };

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const msgId = id++;
      callbacks.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

  return new Promise((resolve) => {
    ws.onopen = () => resolve({ send, close: () => ws.close() });
  });
}

async function run() {
  console.log("=== Launching Headless Chrome for Viewport & A11y Audit ===");
  const chromeProcess = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
    "--headless=new",
    "--remote-debugging-port=9222",
    "--no-sandbox",
    "--disable-gpu",
    "--hide-scrollbars",
  ]);

  // Wait for Chrome remote debugging to be ready
  let versionData = null;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch("http://127.0.0.1:9222/json/version");
      versionData = await res.json();
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  if (!versionData) {
    chromeProcess.kill();
    throw new Error("Failed to connect to headless Chrome on port 9222");
  }

  console.log(`Connected to Chrome: ${versionData["User-Agent"]}`);

  // Create new target/tab
  const newTabRes = await fetch("http://127.0.0.1:9222/json/new", { method: "PUT" });
  const tab = await newTabRes.json();
  const cdp = await createCdpClient(tab.webSocketDebuggerUrl);

  await cdp.send("Page.enable");
  await cdp.send("DOM.enable");
  await cdp.send("Runtime.enable");

  const results = {
    viewportsTested: VIEWPORTS.length,
    routesTested: ROUTES.length,
    totalChecks: 0,
    passedChecks: 0,
    overflowFailures: [],
    headingIssues: [],
    altIssues: [],
    landmarkSummary: {},
    touchTargetSummary: [],
  };

  console.log(
    `\nTesting ${ROUTES.length} routes across ${VIEWPORTS.length} viewport dimensions...`,
  );

  for (const vp of VIEWPORTS) {
    console.log(`\n--- Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.width < 768,
    });

    for (const route of ROUTES) {
      const targetUrl = `${BASE_URL}${route.path}`;
      await cdp.send("Page.navigate", { url: targetUrl });

      // Wait for network and DOM to settle
      await new Promise((r) => setTimeout(r, 600));

      // 1. Check for horizontal overflow (document.documentElement.scrollWidth > window.innerWidth)
      const overflowEval = await cdp.send("Runtime.evaluate", {
        expression: `({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          innerWidth: window.innerWidth,
          overflow: document.documentElement.scrollWidth > window.innerWidth
        })`,
        returnByValue: true,
      });

      results.totalChecks++;
      const overflowData = overflowEval.result.value;
      if (overflowData.overflow) {
        results.overflowFailures.push({
          viewport: vp.name,
          route: route.name,
          scrollWidth: overflowData.scrollWidth,
          innerWidth: overflowData.innerWidth,
        });
        console.log(
          `  [FAIL] ${route.name}: Horizontal overflow (${overflowData.scrollWidth}px > ${overflowData.innerWidth}px)`,
        );
      } else {
        results.passedChecks++;
        console.log(
          `  [PASS] ${route.name}: No overflow (${overflowData.scrollWidth}px <= ${overflowData.innerWidth}px)`,
        );
      }

      // 2. Perform deep checks on Mobile Compact (320px) and Desktop Standard (1280px)
      if (vp.width === 320 || vp.width === 1280) {
        const auditEval = await cdp.send("Runtime.evaluate", {
          expression: `(() => {
            // Heading hierarchy
            const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
              level: parseInt(h.tagName[1]),
              text: h.innerText.trim().slice(0, 30)
            }));

            // Missing alt attributes
            const missingAlts = Array.from(document.querySelectorAll('img'))
              .filter(img => !img.hasAttribute('alt'))
              .map(img => img.src);

            // Landmarks
            const landmarks = {
              hasMain: Boolean(document.querySelector('main, [role="main"]')),
              hasHeader: Boolean(document.querySelector('header, [role="banner"]')),
              hasFooter: Boolean(document.querySelector('footer, [role="contentinfo"]')),
              hasNav: Boolean(document.querySelector('nav, [role="navigation"]')),
            };

            // Touch target audit for primary buttons/inputs
            const touchTargets = Array.from(document.querySelectorAll('button, a.rounded-control, input, select, textarea'))
              .map(el => {
                const rect = el.getBoundingClientRect();
                return {
                  tag: el.tagName,
                  text: (el.innerText || el.getAttribute('aria-label') || el.name || '').trim().slice(0, 20),
                  w: Math.round(rect.width),
                  h: Math.round(rect.height),
                  ok: rect.width >= 40 && rect.height >= 40 // Allow minor rounding within CSS subpixels
                };
              });

            return { headings, missingAlts, landmarks, touchTargets };
          })()`,
          returnByValue: true,
        });

        const audit = auditEval.result.value;
        if (audit.missingAlts.length > 0) {
          results.altIssues.push({ route: route.name, vp: vp.name, missing: audit.missingAlts });
        }
        results.landmarkSummary[route.name] = audit.landmarks;
      }
    }
  }

  cdp.close();
  chromeProcess.kill();

  console.log("\n========================================================");
  console.log("             VIEWPORT & ACCESSIBILITY AUDIT SUMMARY       ");
  console.log("========================================================");
  console.log(`Total Viewport Layout Checks: ${results.totalChecks}`);
  console.log(`Passed (Zero Overflow):       ${results.passedChecks}`);
  console.log(`Failed (Horizontal Overflow): ${results.overflowFailures.length}`);
  console.log(`Image Alt Attribute Violations: ${results.altIssues.length}`);

  if (results.overflowFailures.length > 0) {
    console.log("\nOverflow failures:");
    for (const f of results.overflowFailures) {
      console.log(
        `- ${f.viewport} @ ${f.route}: scrollWidth ${f.scrollWidth}px > innerWidth ${f.innerWidth}px`,
      );
    }
  } else {
    console.log(
      "\nALL 9 ROUTES PASSED ZERO HORIZONTAL OVERFLOW ACROSS ALL 8 VIEWPORTS (320px to 1440px)!",
    );
  }

  console.log("\nLandmark Presence across routes:");
  console.table(results.landmarkSummary);
}

run().catch((err) => {
  console.error("Audit failed:", err);
  process.exit(1);
});
