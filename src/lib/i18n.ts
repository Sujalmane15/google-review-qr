import { SupportedLanguage } from "@/types";

export interface Translations {
  title: string;
  howWasExperience: string;
  whatDidYouLike: string;
  anythingToMention: string;
  placeholderText: string;
  generateButton: string;
  generating: string;
  selectSuggestion: string;
  selectedReview: string;
  helperText: string;
  copyReview: string;
  continueToGoogle: string;
  reviewCopiedToast: string;
  copiedFallback: string;
  starsLabel: (rating: number) => string;
  aiDisclaimer: string;
  emptyReviewWarning: string;
  openGoogleDirectly: string;
  rateLimitError: string;
}

export const translations: Record<SupportedLanguage, Translations> = {
  en: {
    title: "Google Review Helper",
    howWasExperience: "How was your experience?",
    whatDidYouLike: "Highlight what you appreciated:",
    anythingToMention: "Anything specific you'd like to mention?",
    placeholderText: "e.g. prompt service, high quality work, professional communication...",
    generateButton: "✨ Generate 3 Review Suggestions",
    generating: "Generating honest suggestions...",
    selectSuggestion: "Choose a draft to customize:",
    selectedReview: "Your Review (editable):",
    helperText: "You can edit this review before posting to Google.",
    copyReview: "Copy Review",
    continueToGoogle: "Copy Review & Continue to Google",
    reviewCopiedToast: "Your review has been copied! Paste it on Google and tap Post.",
    copiedFallback: "Copied to clipboard!",
    starsLabel: (r) => `${r} star${r > 1 ? "s" : ""}`,
    aiDisclaimer: "AI suggestions are editable drafts based strictly on your selections. Nothing is automatically submitted.",
    emptyReviewWarning: "Please choose a rating to generate suggestions, or proceed directly to Google.",
    openGoogleDirectly: "Continue to Google Review without AI",
    rateLimitError: "AI suggestions are temporarily busy. You can write your own review above and continue directly to Google.",
  },
  mr: {
    title: "गुगल रिव्ह्यू मदतनीस",
    howWasExperience: "तुमचा अनुभव कसा होता?",
    whatDidYouLike: "तुम्हाला काय आवडले ते निवडा:",
    anythingToMention: "काही विशेष सांगायचे आहे का?",
    placeholderText: "उदा. वेळेत सेवा, दर्जेदार काम, उत्तम सहकार्य...",
    generateButton: "✨ ३ रिव्ह्यू सूचना तयार करा",
    generating: "सूचना तयार होत आहेत...",
    selectSuggestion: "योग्य रिव्ह्यू निवडा:",
    selectedReview: "तुमचा रिव्ह्यू (बदल करू शकता):",
    helperText: "गुगलवर पोस्ट करण्यापूर्वी तुम्ही यामध्ये बदल करू शकता.",
    copyReview: "रिव्ह्यू कॉपी करा",
    continueToGoogle: "रिव्ह्यू कॉपी करा आणि गुगलवर जा",
    reviewCopiedToast: "तुमचा रिव्ह्यू कॉपी झाला आहे! गुगलवर जाऊन पेस्ट करा आणि पोस्ट करा.",
    copiedFallback: "क्लिपबोर्डवर कॉपी केले!",
    starsLabel: (r) => `${r} स्टार`,
    aiDisclaimer: "या सूचना तुमच्या निवडीवर आधारित मसुदे आहेत. काहीही आपोआप पोस्ट होत नाही.",
    emptyReviewWarning: "कृपया रेटिंग निवडा किंवा थेट गुगलवर जाऊन रिव्ह्यू द्या.",
    openGoogleDirectly: "थेट गुगलवर रिव्ह्यू द्या",
    rateLimitError: "सर्व्हर व्यस्त आहे. तुम्ही तुमचा स्वतःचा रिव्ह्यू लिहून थेट गुगलवर जाऊ शकता.",
  },
  hi: {
    title: "गूगल रिव्यू सहायक",
    howWasExperience: "आपका अनुभव कैसा रहा?",
    whatDidYouLike: "बताएं आपको क्या पसंद आया:",
    anythingToMention: "कुछ खास जो आप बताना चाहें?",
    placeholderText: "जैसे: समय पर सेवा, बेहतरीन काम, पेशेवर रवैया...",
    generateButton: "✨ ३ रिव्यू सुझाव बनाएं",
    generating: "सुझाव तैयार किए जा रहे हैं...",
    selectSuggestion: "अपनी पसंद का रिव्यू चुनें:",
    selectedReview: "आपका रिव्यू (बदलाव कर सकते हैं):",
    helperText: "गूगल पर पोस्ट करने से पहले आप इसमें बदलाव कर सकते हैं।",
    copyReview: "रिव्यू कॉपी करें",
    continueToGoogle: "रिव्यू कॉपी करें और गूगल पर जाएं",
    reviewCopiedToast: "आपका रिव्यू कॉपी हो गया है! गूगल पर पेस्ट करें और पोस्ट करें।",
    copiedFallback: "क्लिपबोर्ड पर कॉपी किया गया!",
    starsLabel: (r) => `${r} स्टार`,
    aiDisclaimer: "यह सुझाव केवल आपकी दी गई जानकारी पर आधारित ड्राफ्ट हैं। कुछ भी स्वतः सबमिट नहीं होता।",
    emptyReviewWarning: "कृपया रेटिंग चुनें या सीधे गूगल पर जाकर रिव्यू दें।",
    openGoogleDirectly: "सीधे गूगल पर रिव्यू दें",
    rateLimitError: "सर्वर व्यस्त है। आप अपना रिव्यू लिखकर सीधे गूगल पर जा सकते हैं।",
  },
};
