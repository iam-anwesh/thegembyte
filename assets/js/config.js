/*
 * Site-wide settings. Edit this file to rebrand or switch store modes —
 * no other code changes are needed.
 */
window.SITE = {
  name: "TheGemByte",
  tagline: "Hidden gems, hand-picked.",
  url: "https://iam-anwesh.github.io/thegembyte",
  email: "hello@thegembyte.com",
  currency: "AUD",
  locale: "en-AU",

  // Appended to every affiliate link that doesn't already carry a tag.
  // Example for Amazon Associates Australia: { tag: "yourtag-22" }
  // The Amazon tracking ID set in the admin portal (Site settings) overrides `tag`.
  affiliateParams: {},

  // Affiliate products always link out to the merchant. Own-store products
  // ("type": "store") go into the cart; while checkout is disabled the cart
  // page collects a pre-order email instead of payment.
  checkout: {
    enabled: false,
    // Wire a provider here later: "stripe-payment-links", "snipcart"…
    provider: null,
    freeShippingThreshold: 75,
    shippingFlat: 10
  },

  // Form endpoints (e.g. Formspree, Getform, Mailchimp/ConvertKit form URLs).
  // Forms POST here as FormData. Leave empty while developing: the form still
  // shows a thank-you message and logs a warning to the console.
  forms: {
    newsletter: "",
    contact: ""
  },

  // Optional analytics hook. Every affiliate click / add-to-cart pushes an
  // event onto window.dataLayer (works with Google Tag Manager / GA4).
  analytics: { enabled: true },

  social: {
    instagram: "https://instagram.com/",
    pinterest: "https://pinterest.com/",
    youtube: "https://youtube.com/"
  }
};
