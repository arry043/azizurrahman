/**
 * Authoritative Client Information & Scholar Profile for Maulvi Azizurrahman.
 * Source of truth: Client brief & order documentation.
 *
 * All biographical and spiritual guidance descriptions are strictly attributed to
 * client-provided statements without fabricated credentials, exaggerated outcomes,
 * or commercialized guarantees.
 */

export interface ScholarProfile {
  identity: {
    fullNameEn: string;
    fullNameUr: string;
    honorificEn: string;
    titleEn: string;
    titleUr: string;
    avatar: {
      src: string;
      originalSrc?: string;
      width: number;
      height: number;
      alt: string;
    };
  };
  education: {
    institution: string;
    institutionUr: string;
    location: string;
    locationUr: string;
  };
  contact: {
    address: {
      village: string;
      town: string;
      district: string;
      state: string;
      country: string;
      pincode: string;
      full: string;
      compact: string;
      mapsSearchUrl: string;
    };
    email: string;
    phone: {
      rawInput: string;
      internationalCandidate: string;
      isConfirmed: boolean;
      confirmationNote: string;
    };
    whatsapp: {
      defaultMessageEn: string;
      defaultMessageUr: string;
    };
  };
  content: {
    en: {
      shortBio: string;
      aboutIntro: string;
      aboutParagraphs: readonly string[];
      approachHeading: string;
      approachParagraphs: readonly string[];
      concernsAddressed: readonly string[];
      faithPerspective: string;
      consultationNotice: string;
    };
    ur: {
      shortBio: string;
      aboutIntro: string;
      aboutParagraphs: readonly string[];
      concernsAddressed: readonly string[];
      faithPerspective: string;
    };
  };
}

export const scholarProfile: ScholarProfile = {
  identity: {
    fullNameEn: "Maulvi Azizurrahman (Aamil)",
    fullNameUr: "مولوی عزیز الرحمٰن (عامل)",
    honorificEn: "Maulvi",
    titleEn: "Spiritual Guide & Consultant (Aamil)",
    titleUr: "روحانی رہبر و عامل",
    avatar: {
      src: "/scholar/maulvi-azizurrahman-nobg.png",
      originalSrc: "/scholar/maulvi-azizurrahman.jpg",
      width: 782,
      height: 1024,
      alt: "Maulvi Azizurrahman (Aamil)",
    },
  },
  education: {
    institution: "Madrasa Arabia Baitul Uloom",
    institutionUr: "مدرسہ عربیہ بیت العلوم",
    location: "Saraimeer, Azamgarh, Uttar Pradesh, India",
    locationUr: "سرائمیر، اعظم گڑھ، اترپردیش، انڈیا",
  },
  contact: {
    address: {
      village: "Village Kharewan",
      town: "Saraimeer",
      district: "Azamgarh",
      state: "Uttar Pradesh",
      country: "India",
      pincode: "276305",
      full: "Village Kharewan, Saraimeer, Azamgarh, Uttar Pradesh, India — 276305",
      compact: "Village Kharewan, Saraimeer, Azamgarh, UP, India 276305",
      mapsSearchUrl:
        "https://www.google.com/maps/search/?api=1&query=Village+Kharewan%2C+Saraimeer%2C+Azamgarh%2C+Uttar+Pradesh+276305+India",
    },
    email: "azizurrahman8423@gmail.com",
    phone: {
      rawInput: "8423668492",
      internationalCandidate: "+918423668492",
      isConfirmed: false,
      confirmationNote:
        "Direct calling and WhatsApp links require explicit confirmation of international calling prefix (+91) before production activation.",
    },
    whatsapp: {
      defaultMessageEn:
        "Assalamu Alaikum, I would like to enquire about an appointment with Maulvi Azizurrahman.",
      defaultMessageUr:
        "السلام علیکم، میں مولوی عزیز الرحمٰن صاحب سے ملاقات یا مشاورت کے سلسلے میں رابطہ کرنا چاہتا ہوں۔",
    },
  },
  content: {
    en: {
      shortBio:
        "Maulvi Azizurrahman (Aamil) completed his studies at Madrasa Arabia Baitul Uloom, Saraimeer, Azamgarh, Uttar Pradesh. Grounded in the five daily prayers and the teachings of the Qur'an and Sunnah, his spiritual guidance is rooted in the Qur'an and Hadith for those seeking counsel, peace, and hope.",
      aboutIntro:
        "Dedicated spiritual guidance, prayer, and ethical consultation grounded in authentic Islamic teachings.",
      aboutParagraphs: [
        "Maulvi Azizurrahman (Aamil) completed his formal Islamic studies at Madrasa Arabia Baitul Uloom in Saraimeer, Azamgarh, Uttar Pradesh, India.",
        "According to the client, he strictly observes the five daily prayers and adheres faithfully to the teachings of the Qur'an and Sunnah. His consultation and spiritual guidance are conducted in the light of the Qur'an and Hadith, offering a calm and principled space for seekers.",
      ],
      approachHeading: "Spiritual Guidance & Scope of Practice",
      approachParagraphs: [
        "His work focuses on sincere spiritual guidance for individuals confronting personal difficulties, including concerns related to Jaadu (black magic) and Nazar-e-Bad (evil eye).",
        "For individuals and couples who have been unable to have children and have experienced disappointment following medical treatments, spiritual practices based on the Qur'an and Hadith are offered as a supportive avenue of prayer, spiritual contemplation, and hope.",
      ],
      concernsAddressed: [
        "Spiritual guidance based strictly on Qur'an and Hadith",
        "Assistance with concerns regarding Jaadu (black magic)",
        "Spiritual prayers regarding Nazar-e-Bad (evil eye)",
        "Supplication and guidance for couples facing child-bearing difficulties",
      ],
      faithPerspective:
        "In accordance with Islamic faith, Allah alone is the ultimate giver of healing (Ash-Shafi) and all outcomes are entirely by Allah's divine grace and will. Consultations and supplications do not substitute for certified medical care or guarantee specific outcomes.",
      consultationNotice:
        "Consultations are arranged strictly in advance to preserve visitor privacy and dedicated attention. Submitting an online request reserves a provisional slot pending review by the coordinator.",
    },
    ur: {
      shortBio:
        "مولوی عزیز الرحمٰن (عامل) نے مدرسہ عربیہ بیت العلوم، سرائمیر، اعظم گڑھ، اترپردیش سے اپنی تعلیم مکمل کی ہے۔ آپ پانچ وقت کی نماز کے پابند ہیں اور قرآن و سنت کی روشنی میں روحانی رہنمائی فرماتے ہیں۔",
      aboutIntro: "قرآن و حدیث کی روشنی میں مخلصانہ روحانی رہنمائی، دعائیں اور باوقار مشاورت۔",
      aboutParagraphs: [
        "مولوی عزیز الرحمٰن (عامل) نے مدرسہ عربیہ بیت العلوم، سرائمیر، اعظم گڑھ، اترپردیش، انڈیا سے اپنی تعلیم مکمل کی ہے۔",
        "الحمدللہ، آپ پانچ وقت کی نماز کے پابند ہیں اور قرآن و سنت کی تعلیمات پر عمل کرتے ہیں۔ آپ اپنے تمام کام قرآن و حدیث کی روشنی میں انجام دیتے ہیں۔",
      ],
      concernsAddressed: [
        "قرآن و حدیث کے مطابق روحانی رہنمائی",
        "جادو اور اثرات بد کے مسائل کے لیے مسنون دعائیں",
        "نظرِ بد کے خاتمے کے لیے روحانی تدابیر",
        "بے اولادی کے مسائل اور ناامید افراد کے لیے دعائیہ رہنمائی",
      ],
      faithPerspective:
        "اللہ تعالیٰ ہی شفا دینے والا اور ہر چیز پر قادر ہے۔ تمام نتائج اللہ سبحانہٗ وتعالیٰ کے فضل و کرم کے تابع ہیں۔",
    },
  },
};
