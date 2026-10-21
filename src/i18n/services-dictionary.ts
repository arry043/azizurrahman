import type { Locale } from "./config";
import type { PublicService } from "@/types/domain";

export interface LocalizedServiceContent {
  name: string;
  short_description: string | null;
  description: string | null;
}

export const KNOWN_SERVICES_URDU: Record<string, LocalizedServiceContent> = {
  "dev-sample-short-consultation": {
    name: "مختصر مشاورتی نشست (آزمائشی)",
    short_description: "آزمائشی مشاورتی نمونہ — اوقاتِ کار اور شیڈول کی جانچ کے لیے۔",
    description:
      "یہ نشست مشاورتی کیٹلاگ اور بکنگ کے مراحل کی تصدیق کے لیے پیش کی گئی ہے۔ باضابطہ خدمات کی اشاعت تک اسے بطورِ نمونہ استعمال کیا جاتا ہے۔",
  },
  "dev-sample-standard-consultation": {
    name: "معیاری مشاورتی نشست (آزمائشی)",
    short_description: "جامع اور تفصیلی مشاورت کا آزمائشی نمونہ۔",
    description: "تفصیلی گفتگو اور وقتاً فوقتاً درکار وقفوں (بفر) کی جانچ کے لیے مخصوص نشست۔",
  },
  "dua-and-supplication": {
    name: "مسنون دعائیں اور روحانی رہنمائی",
    short_description: "قرآن و سنت کی روشنی میں خصوصی دعائیں اور قلبی سکون کی تدابیر۔",
    description:
      "انفرادی دعاؤں، ذکر و اذکار اور روحانی پریشانیوں کے شرعی حل کے لیے خصوصی رہنمائی نشست۔",
  },
  "family-consultation": {
    name: "خاندانی و ازدواجی مشاورت",
    short_description: "اسلامی اقدار کے مطابق گھریلو معاملات اور باہمی فہم و تفہیم کی نشست۔",
    description: "ازدواجی، خاندانی اور رشتوں کے مسائل کے حل کے لیے گہری اور ہمدردانہ شرعی مشاورت۔",
  },
};

/**
 * Returns localized service presentation without mutating database values or API payloads.
 */
export function getLocalizedService(
  service: PublicService,
  locale: Locale,
): LocalizedServiceContent {
  if (locale === "ur") {
    const translation = KNOWN_SERVICES_URDU[service.slug];
    if (translation) {
      return {
        name: translation.name,
        short_description: translation.short_description ?? service.short_description,
        description: translation.description ?? service.description,
      };
    }
  }

  return {
    name: service.name,
    short_description: service.short_description,
    description: service.description,
  };
}
