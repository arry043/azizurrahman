import { scholarProfile } from "@/config/scholar-profile";
import { siteConfig } from "@/config/site";
import type { AppointmentNotificationPayload, EmailRenderOutput, NotificationEvent } from "./types";

function formatDate(isoString: string, timeZone: string): string {
  try {
    return new Date(isoString).toLocaleDateString("en-US", {
      timeZone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return isoString;
  }
}

function formatTimeRange(startIso: string, endIso: string, timeZone: string): string {
  try {
    const start = new Date(startIso).toLocaleTimeString("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
    });
    const end = new Date(endIso).toLocaleTimeString("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${start} – ${end} (${timeZone})`;
  } catch {
    return `${startIso} – ${endIso}`;
  }
}

function buildBaseEmailHtml(params: {
  title: string;
  badgeLabel: string;
  badgeColor: string;
  customerName: string;
  leadParagraph: string;
  additionalDetails?: string;
  data: AppointmentNotificationPayload;
  siteUrl: string;
}): string {
  const {
    title,
    badgeLabel,
    badgeColor,
    customerName,
    leadParagraph,
    additionalDetails,
    data,
    siteUrl,
  } = params;
  const dateStr = formatDate(data.appointmentStart, data.timeZone);
  const timeStr = formatTimeRange(data.appointmentStart, data.appointmentEnd, data.timeZone);
  const receiptUrl = `${siteUrl}/appointments/${encodeURIComponent(data.publicReference)}`;

  const servicesHtml = data.services
    .map(
      (s) =>
        `<tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #d9cfb9; font-size: 14px; color: #23302a;">${escapeHtml(s.name)}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #d9cfb9; font-size: 14px; color: #6a706b; text-align: right;">${s.durationMinutes} mins</td>
        </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fbf5e8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #23302a; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fbf5e8; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; border: 1px solid #d9cfb9; overflow: hidden; box-shadow: 0 4px 16px rgba(3, 47, 37, 0.08);">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #032f25; padding: 28px 24px; text-align: center;">
              <h1 style="margin: 0; font-family: Georgia, serif; font-size: 26px; color: #fbf5e8; letter-spacing: 0.5px;">${escapeHtml(siteConfig.name)}</h1>
              <p style="margin: 6px 0 0; font-size: 13px; color: #c6a45a; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">${escapeHtml(scholarProfile.identity.fullNameEn)}</p>
            </td>
          </tr>

          <!-- Status Badge & Greeting -->
          <tr>
            <td style="padding: 32px 28px 16px;">
              <div style="display: inline-block; padding: 6px 14px; border-radius: 9999px; background-color: ${badgeColor}; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px;">
                ${escapeHtml(badgeLabel)}
              </div>
              <h2 style="margin: 0 0 12px; font-family: Georgia, serif; font-size: 22px; color: #07553d;">${escapeHtml(title)}</h2>
              <p style="margin: 0 0 16px; font-size: 15px; color: #23302a;">Assalamu Alaikum <strong>${escapeHtml(customerName)}</strong>,</p>
              <p style="margin: 0 0 20px; font-size: 15px; color: #4a524e; line-height: 1.6;">${escapeHtml(leadParagraph)}</p>
              ${additionalDetails ? `<p style="margin: 0 0 20px; font-size: 14px; color: #6a706b; line-height: 1.5;">${escapeHtml(additionalDetails)}</p>` : ""}
            </td>
          </tr>

          <!-- Reference Code Callout -->
          <tr>
            <td style="padding: 0 28px 24px;">
              <div style="background-color: #f2e8d2; border: 2px dashed #c6a45a; border-radius: 8px; padding: 16px; text-align: center;">
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #9a742d; font-weight: 700;">Appointment Reference</p>
                <p style="margin: 4px 0 0; font-family: monospace; font-size: 22px; font-weight: 700; color: #07553d; letter-spacing: 2px;">${escapeHtml(data.publicReference)}</p>
              </div>
            </td>
          </tr>

          <!-- Appointment Summary Card -->
          <tr>
            <td style="padding: 0 28px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #d9cfb9; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 10px 14px; background-color: #fbf5e8; border-bottom: 1px solid #d9cfb9; font-size: 13px; font-weight: 600; color: #07553d;">Date:</td>
                  <td style="padding: 10px 14px; background-color: #fbf5e8; border-bottom: 1px solid #d9cfb9; font-size: 13px; color: #23302a; text-align: right;">${escapeHtml(dateStr)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #d9cfb9; font-size: 13px; font-weight: 600; color: #07553d;">Allocated Time:</td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #d9cfb9; font-size: 13px; color: #23302a; text-align: right;">${escapeHtml(timeStr)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 12px 14px 4px; background-color: #ffffff; font-size: 12px; font-weight: 700; color: #9a742d; text-transform: uppercase; letter-spacing: 1px;">Requested Services:</td>
                </tr>
                ${servicesHtml}
              </table>
            </td>
          </tr>

          <!-- Online Lookup Action Link -->
          <tr>
            <td style="padding: 0 28px 28px; text-align: center;">
              <a href="${escapeHtml(receiptUrl)}" style="display: inline-block; background-color: #07553d; color: #fbf5e8; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; letter-spacing: 0.5px;">View Online Receipt &amp; Status</a>
              <p style="margin: 12px 0 0; font-size: 12px; color: #6a706b;">You can also check your appointment anytime via the Appointment Lookup tool on our portal.</p>
            </td>
          </tr>

          <!-- Footer & Contact Details -->
          <tr>
            <td style="background-color: #f2e8d2; padding: 24px; border-top: 1px solid #d9cfb9; font-size: 12px; color: #6a706b; text-align: center; line-height: 1.5;">
              <p style="margin: 0 0 6px; font-weight: 600; color: #23302a;">${escapeHtml(scholarProfile.identity.fullNameEn)}</p>
              <p style="margin: 0 0 8px;">${escapeHtml(scholarProfile.contact.address.full)}</p>
              <p style="margin: 0 0 12px;">Email: <a href="mailto:${scholarProfile.contact.email}" style="color: #07553d; text-decoration: underline;">${scholarProfile.contact.email}</a></p>
              <p style="margin: 0; font-size: 11px; font-style: italic;">${escapeHtml("Notice: Islamic spiritual consultations and supplications are advisory in nature. In accordance with faith, healing is solely by Allah's grace and divine will.")}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderAppointmentEmail(
  event: NotificationEvent,
  data: AppointmentNotificationPayload,
  siteUrl: string,
): EmailRenderOutput {
  const dateStr = formatDate(data.appointmentStart, data.timeZone);
  const timeStr = formatTimeRange(data.appointmentStart, data.appointmentEnd, data.timeZone);
  const receiptUrl = `${siteUrl}/appointments/${encodeURIComponent(data.publicReference)}`;
  const servicesSummary = data.services.map((s) => `${s.name} (${s.durationMinutes}m)`).join(", ");

  switch (event) {
    case "booking_request_received": {
      const subject = `[${siteConfig.name}] Consultation Request Received — Ref: ${data.publicReference}`;
      const leadParagraph =
        "Thank you for requesting an appointment with Maulvi Azizurrahman. Your request has been logged successfully and is currently awaiting review by our consultation coordinator. Please note that this notice acknowledges receipt of your request and does not represent a finalized confirmation.";
      const html = buildBaseEmailHtml({
        title: "Consultation Request Received",
        badgeLabel: "Pending Review",
        badgeColor: "#fff3cd",
        customerName: data.customerName,
        leadParagraph,
        additionalDetails:
          "Once schedule availability is confirmed, you will receive an updated status notice. If you have urgent questions, please quote your reference code when contacting our office.",
        data,
        siteUrl,
      });

      const text = [
        `Assalamu Alaikum ${data.customerName},`,
        "",
        leadParagraph,
        "",
        `Appointment Reference: ${data.publicReference}`,
        `Status: Pending Review`,
        `Date: ${dateStr}`,
        `Time: ${timeStr}`,
        `Services: ${servicesSummary}`,
        "",
        `View online receipt: ${receiptUrl}`,
        "",
        `Office Contact: ${scholarProfile.contact.email}`,
        `Address: ${scholarProfile.contact.address.full}`,
      ].join("\n");

      return { subject, html, text };
    }

    case "appointment_confirmed": {
      const subject = `[${siteConfig.name}] Consultation Confirmed — Ref: ${data.publicReference}`;
      const leadParagraph =
        "We are pleased to inform you that your spiritual consultation appointment with Maulvi Azizurrahman has been reviewed and officially confirmed. Your dedicated slot has been reserved.";
      const html = buildBaseEmailHtml({
        title: "Consultation Confirmed",
        badgeLabel: "Confirmed",
        badgeColor: "#d1e7dd",
        customerName: data.customerName,
        leadParagraph,
        additionalDetails:
          "Please ensure you are reachable at your registered phone number at the scheduled time. If you need to make any adjustments, please notify us well in advance.",
        data,
        siteUrl,
      });

      const text = [
        `Assalamu Alaikum ${data.customerName},`,
        "",
        leadParagraph,
        "",
        `Appointment Reference: ${data.publicReference}`,
        `Status: Confirmed`,
        `Date: ${dateStr}`,
        `Time: ${timeStr}`,
        `Services: ${servicesSummary}`,
        "",
        `View online receipt: ${receiptUrl}`,
        "",
        `Office Contact: ${scholarProfile.contact.email}`,
      ].join("\n");

      return { subject, html, text };
    }

    case "appointment_declined": {
      const subject = `[${siteConfig.name}] Consultation Request Update — Ref: ${data.publicReference}`;
      const reasonText = data.reason
        ? `Note from coordinator: ${data.reason}`
        : "We regret that the requested consultation slot cannot be accommodated at this time.";
      const leadParagraph =
        "Regarding your consultation request with Maulvi Azizurrahman, we are unable to accept the selected schedule. We invite you to review our schedule or contact our office to explore alternate availability.";
      const html = buildBaseEmailHtml({
        title: "Request Could Not Be Accommodated",
        badgeLabel: "Declined",
        badgeColor: "#f8d7da",
        customerName: data.customerName,
        leadParagraph,
        additionalDetails: reasonText,
        data,
        siteUrl,
      });

      const text = [
        `Assalamu Alaikum ${data.customerName},`,
        "",
        leadParagraph,
        reasonText,
        "",
        `Appointment Reference: ${data.publicReference}`,
        `Status: Declined`,
        `Date Requested: ${dateStr}`,
        `Services: ${servicesSummary}`,
        "",
        `View online status: ${receiptUrl}`,
        "",
        `Office Contact: ${scholarProfile.contact.email}`,
      ].join("\n");

      return { subject, html, text };
    }

    case "appointment_cancelled": {
      const subject = `[${siteConfig.name}] Consultation Cancelled — Ref: ${data.publicReference}`;
      const reasonText = data.reason ? `Reason: ${data.reason}` : "";
      const leadParagraph =
        "Your scheduled consultation appointment with Maulvi Azizurrahman has been cancelled.";
      const html = buildBaseEmailHtml({
        title: "Consultation Cancelled",
        badgeLabel: "Cancelled",
        badgeColor: "#f8d7da",
        customerName: data.customerName,
        leadParagraph,
        additionalDetails: reasonText,
        data,
        siteUrl,
      });

      const text = [
        `Assalamu Alaikum ${data.customerName},`,
        "",
        leadParagraph,
        reasonText,
        "",
        `Appointment Reference: ${data.publicReference}`,
        `Status: Cancelled`,
        `Services: ${servicesSummary}`,
        "",
        `View online status: ${receiptUrl}`,
      ].join("\n");

      return { subject, html, text };
    }

    case "appointment_rescheduled": {
      const subject = `[${siteConfig.name}] Consultation Rescheduled — Ref: ${data.publicReference}`;
      const reasonText = data.reason ? `Reason: ${data.reason}` : "";
      const leadParagraph =
        "Your spiritual consultation appointment with Maulvi Azizurrahman has been rescheduled to a new date and time.";
      const html = buildBaseEmailHtml({
        title: "Consultation Rescheduled",
        badgeLabel: "Rescheduled",
        badgeColor: "#cff4fc",
        customerName: data.customerName,
        leadParagraph,
        additionalDetails: `Your new appointment time is confirmed below. ${reasonText}`,
        data,
        siteUrl,
      });

      const text = [
        `Assalamu Alaikum ${data.customerName},`,
        "",
        leadParagraph,
        `New Date: ${dateStr}`,
        `New Time: ${timeStr}`,
        `Services: ${servicesSummary}`,
        "",
        `Appointment Reference: ${data.publicReference}`,
        `View online receipt: ${receiptUrl}`,
      ].join("\n");

      return { subject, html, text };
    }
  }
}
