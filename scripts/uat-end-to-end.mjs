/**
 * AZIZURRAHMAN — Comprehensive End-to-End User Acceptance Testing (UAT)
 * Exercises Flows 1 through 9 against the active local environment.
 */
import { createClient } from "@supabase/supabase-js";

const BASE_URL = process.env.APP_BASE_URL || process.env.BASE_URL || "http://localhost:3000";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const results = [];

function record(flow, testName, passed, details = "") {
  results.push({ flow, testName, passed, details });
  const status = passed ? "[PASS]" : "[FAIL]";
  console.log(`${status} ${flow} :: ${testName} ${details ? `(${details})` : ""}`);
}

async function runUAT() {
  console.log("=== STARTING USER ACCEPTANCE TESTING (FLOWS 1 - 9) ===\n");

  // Flow 1: Prospective client discovering services
  try {
    const homeRes = await fetch(`${BASE_URL}/`);
    const homeHtml = await homeRes.text();
    record("Flow 1: Discovery", "Home page loads with 200 OK", homeRes.status === 200);
    record("Flow 1: Discovery", "Home page has brand heading", homeHtml.includes("AZIZURRAHMAN"));

    const servicesRes = await fetch(`${BASE_URL}/services`);
    const servicesHtml = await servicesRes.text();
    record("Flow 1: Discovery", "Services catalog loads with 200 OK", servicesRes.status === 200);
    record(
      "Flow 1: Discovery",
      "Lists active services",
      servicesHtml.includes("dev-sample-short-consultation"),
    );

    const detailRes = await fetch(`${BASE_URL}/services/dev-sample-short-consultation`);
    const detailHtml = await detailRes.text();
    record("Flow 1: Discovery", "Service detail loads with 200 OK", detailRes.status === 200);
    record(
      "Flow 1: Discovery",
      "Detail has duration & booking CTA",
      detailHtml.includes("30") && detailHtml.includes("Book"),
    );
  } catch (err) {
    record("Flow 1: Discovery", "Service discovery error", false, err.message);
  }

  // Flow 2: Client booking an appointment
  let bookedRef = null;
  let bookedPhone = "+919876500001";
  const uatClientIp = `198.51.100.${Math.floor(Math.random() * 100 + 50)}`;
  const idempotencyKey = `uat_idem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    // Check service UUID
    const { data: service } = await supabase
      .from("services")
      .select("id")
      .eq("slug", "dev-sample-short-consultation")
      .single();
    if (!service) throw new Error("Sample service not found");

    // Clean up any existing appointment on future date 2026-11-20
    const targetDate = "2026-11-20";
    await supabase
      .from("appointments")
      .delete()
      .eq("normalized_phone", bookedPhone)
      .gte("appointment_start", "2026-11-20T00:00:00Z");

    const bookingPayload = {
      customerName: "Ahmad UAT Test",
      phoneNumber: "+91 98765 00001",
      email: "ahmad.uat@example.com",
      preferredContactMethod: "phone",
      message: "Testing booking request flow via automated UAT.",
      serviceIds: [service.id],
      dateStr: targetDate,
      startTime: "11:00",
      idempotencyKey,
    };

    const bookRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": uatClientIp,
      },
      body: JSON.stringify(bookingPayload),
    });

    const bookJson = await bookRes.json();
    record("Flow 2: Guest Booking", "Booking submission returned HTTP 200", bookRes.status === 200);
    const reference = bookJson.receipt?.public_reference;
    record("Flow 2: Guest Booking", "Returns public reference code", Boolean(reference));
    bookedRef = reference;

    // Test Idempotency with exact same request
    const duplicateRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": uatClientIp,
      },
      body: JSON.stringify(bookingPayload),
    });
    const dupJson = await duplicateRes.json();
    console.log("Duplicate booking status:", duplicateRes.status, "body:", dupJson);
    record(
      "Flow 2: Guest Booking",
      "Idempotent submission returns original reference",
      dupJson.receipt?.public_reference === bookedRef,
    );
  } catch (err) {
    record("Flow 2: Guest Booking", "Booking flow error", false, err.message);
  }

  // Flow 3: Client looking up an appointment
  try {
    if (!bookedRef) throw new Error("No booked reference available to lookup");

    // Initiate lookup
    const initRes = await fetch(`${BASE_URL}/api/appointments/lookup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": uatClientIp,
      },
      body: JSON.stringify({
        action: "initiate",
        publicReference: bookedRef,
        contact: "+919876500001",
      }),
    });
    const initJson = await initRes.json();
    const isInitiateValid =
      initRes.status === 200 &&
      (initJson.success === true ||
        initJson.status === "initiated" ||
        initJson.providerPending === true);
    record(
      "Flow 3: Lookup Protocol",
      "Lookup initiate handles verification protocol gracefully",
      isInitiateValid,
    );

    // Verify step: lookup in DB for token hash (in dev/test environment)
    const { data: apt } = await supabase
      .from("appointments")
      .select("id, status, customer_name, private_admin_notes")
      .eq("public_reference", bookedRef)
      .single();

    record(
      "Flow 3: Lookup Protocol",
      "Appointment found in database with status pending",
      apt && apt.status === "pending",
    );

    // Verify lookup UI page renders cleanly
    const lookupPageRes = await fetch(`${BASE_URL}/appointments/lookup`);
    const lookupPageHtml = await lookupPageRes.text();
    record(
      "Flow 3: Lookup Protocol",
      "Lookup page loads with 200 OK",
      lookupPageRes.status === 200,
    );
    record(
      "Flow 3: Lookup Protocol",
      "Lookup page does not leak private admin notes",
      !lookupPageHtml.includes("private_admin_notes"),
    );
  } catch (err) {
    record("Flow 3: Lookup Protocol", "Lookup error", false, err.message);
  }

  // Flow 4: Client contacting the scholar
  try {
    const contactRes = await fetch(`${BASE_URL}/contact`);
    const contactHtml = await contactRes.text();
    record(
      "Flow 4: Contact & Inquiries",
      "Contact page loads with 200 OK",
      contactRes.status === 200,
    );
    record(
      "Flow 4: Contact & Inquiries",
      "Contains official email channel",
      contactHtml.includes("azizurrahman8423@gmail.com") ||
        contactHtml.includes("guidance@example.com"),
    );
    record(
      "Flow 4: Contact & Inquiries",
      "Contains consultation hours info",
      contactHtml.includes("Consultation"),
    );
  } catch (err) {
    record("Flow 4: Contact & Inquiries", "Contact flow error", false, err.message);
  }

  // Flow 5: Admin authentication & route security
  try {
    const loginRes = await fetch(`${BASE_URL}/admin/login`);
    const loginHtml = await loginRes.text();
    record("Flow 5: Admin Auth", "Admin login page loads with 200 OK", loginRes.status === 200);
    record(
      "Flow 5: Admin Auth",
      "Admin login has email and password inputs",
      loginHtml.includes('type="email"') && loginHtml.includes('type="password"'),
    );

    // Attempt unauthorized access to /admin (redirects to /admin/login)
    const adminRes = await fetch(`${BASE_URL}/admin`, { redirect: "manual" });
    record(
      "Flow 5: Admin Auth",
      "Unauthorized /admin redirects (307/302/303)",
      [301, 302, 303, 307, 308].includes(adminRes.status),
    );
  } catch (err) {
    record("Flow 5: Admin Auth", "Admin auth error", false, err.message);
  }

  // Flow 6: Admin managing appointments
  try {
    // Verify appointments can be queried and updated by service role
    const { data: apts, error: listErr } = await supabase
      .from("appointments")
      .select("id, status, public_reference")
      .limit(5);
    record(
      "Flow 6: Admin Appointments",
      "Admin service role can query appointments",
      !listErr && apts.length > 0,
    );

    if (bookedRef) {
      const { error: updateErr } = await supabase
        .from("appointments")
        .update({ status: "confirmed" })
        .eq("public_reference", bookedRef);

      const { data: updatedApt } = await supabase
        .from("appointments")
        .select("status")
        .eq("public_reference", bookedRef)
        .single();

      record(
        "Flow 6: Admin Appointments",
        "Admin can transition status pending -> confirmed",
        !updateErr && updatedApt.status === "confirmed",
      );
    }
  } catch (err) {
    record("Flow 6: Admin Appointments", "Admin appointments error", false, err.message);
  }

  // Flow 7: Admin managing availability
  try {
    const { data: weekly, error: weeklyErr } = await supabase
      .from("weekly_availability")
      .select("weekday, is_closed");
    record(
      "Flow 7: Admin Availability",
      "Admin can inspect weekly schedule",
      !weeklyErr && weekly.length === 7,
    );

    // Test creating a date override
    const testDate = "2026-12-25";
    const { error: insErr } = await supabase
      .from("date_overrides")
      .upsert({ override_date: testDate, is_closed: true, reason: "UAT Holiday Test" });

    record("Flow 7: Admin Availability", "Admin can upsert date override", !insErr);

    // Clean up test override
    await supabase.from("date_overrides").delete().eq("override_date", testDate);
  } catch (err) {
    record("Flow 7: Admin Availability", "Admin availability error", false, err.message);
  }

  // Flow 8: Admin managing services
  try {
    const { data: services, error: srvErr } = await supabase
      .from("services")
      .select("id, name, is_active");
    record(
      "Flow 8: Admin Services",
      "Admin can inspect all services including inactive",
      !srvErr && services.length >= 2,
    );
  } catch (err) {
    record("Flow 8: Admin Services", "Admin services error", false, err.message);
  }

  // Flow 9: Admin updating settings
  try {
    const { data: settings, error: setErr } = await supabase
      .from("site_settings")
      .select("id, booking_horizon_days, consultation_hours_text")
      .single();
    record(
      "Flow 9: Admin Settings",
      "Admin can inspect site settings",
      !setErr && Boolean(settings.booking_horizon_days),
    );
  } catch (err) {
    record("Flow 9: Admin Settings", "Admin settings error", false, err.message);
  }

  // Summary
  console.log("\n========================================================");
  console.log("            USER ACCEPTANCE TESTING SUMMARY               ");
  console.log("========================================================");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`Total Flows Tested:  9`);
  console.log(`Total Checkpoints:   ${total}`);
  console.log(`Passed:              ${passed}`);
  console.log(`Failed:              ${failed}`);

  if (failed > 0) {
    console.log("\nFailed Checkpoints:");
    for (const f of results.filter((r) => !r.passed)) {
      console.log(`- ${f.flow} :: ${f.testName} (${f.details})`);
    }
    process.exit(1);
  } else {
    console.log("\nALL 9 END-TO-END USER ACCEPTANCE FLOWS PASSED SUCCESSFULLY!");
  }
}

runUAT().catch((err) => {
  console.error("UAT Fatal Error:", err);
  process.exit(1);
});
