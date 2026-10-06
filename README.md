# TheGemByte

A static storefront for curated affiliate products, built so it can grow into a full online store. Plain HTML, CSS and JavaScript: no build step and no dependencies. Host it anywhere (GitHub Pages, Netlify, Cloudflare Pages, S3).

## Live site

Hosted on GitHub Pages at **https://iam-anwesh.github.io/thegembyte/** (Settings → Pages → deploy from `main`, `/ (root)`).

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Structure

| Path | Purpose |
| --- | --- |
| `index.html` | Home: hero, categories, featured, deals, originals, newsletter |
| `shop.html` | Catalogue with search, category/seller/price/stock filters and sorting (state kept in the URL) |
| `product.html?id=…` | Product detail with Product JSON-LD for rich results |
| `cart.html` | Bag for products you sell directly, with a free-shipping progress bar |
| `wishlist.html` | Saved products (kept in the browser) |
| `about`, `contact`, `disclosure`, `privacy`, `terms`, `shipping`, `404` | Content and legal pages |
| `assets/js/config.js` | **Site settings:** name, currency, affiliate tags, form endpoints, checkout |
| `assets/js/products.js` | **Catalogue:** categories and products |
| `assets/js/app.js` | All storefront logic |
| `assets/css/styles.css` | Styles with light and dark themes |

The header and footer are rendered by `app.js`, so you edit navigation in one place.

## Adding products

Add an entry to `window.PRODUCTS` in `assets/js/products.js`.

**Affiliate product** (the button links out to the merchant):

```js
{ id: "my-product", name: "…", brand: "…", category: "tech", type: "affiliate",
  merchant: "Amazon", affiliateUrl: "https://www.amazon.com.au/dp/ASIN",
  price: 29.99, compareAt: 39.99, rating: 4.5, reviews: 120,
  badges: ["Editor's pick"], featured: true, image: "assets/img/my-product.jpg",
  summary: "…", highlights: ["…", "…"] }
```

**Your own product** (goes into the bag): use `type: "store"` and add `sku` and `stock`. Leave out `merchant` and `affiliateUrl`.

Prices can have cents (`29.99`); whole amounts show without them. Only set `compareAt` when the retailer shows a real was-price or RRP, and copy `rating` and `reviews` from the listing, because they appear in search results. If `image` is empty, a coloured placeholder is shown. After adding products, update `sitemap.xml`.

## Affiliate setup

- Put your tracked links in `affiliateUrl`. Or set a global tag in `config.js`, for example `affiliateParams: { tag: "yourtag-22" }` (Amazon Australia tags end in `-22`), and it is added to every affiliate link that doesn't already have one.
- Outbound links use `rel="sponsored nofollow noopener"`, as Google requires for paid links.
- The disclosure appears in the footer, on the shop page and on every affiliate product page, as the Amazon Associates program requires.
- Every affiliate click, product view, add-to-cart and form submit is pushed to `window.dataLayer`. Add a Google Tag Manager or GA4 snippet to start recording them.

## Forms (newsletter, contact, pre-orders)

Set `SITE.forms.newsletter` and `SITE.forms.contact` in `config.js` to a form backend URL (Formspree, Getform, Basin, or a Mailchimp/ConvertKit endpoint). Until they are set, forms show the thank-you message but **nothing is sent**; a warning is logged in the console.

## Turning on the online store

1. Set `checkout.enabled: true` in `config.js`. The bag then shows a **Checkout securely** button in place of the pre-order form.
2. That button fires a `tgb:checkout` event with the bag contents. Connect it to your payment provider, for example:
   ```js
   document.addEventListener("tgb:checkout", (e) => {
     // e.detail = { items: [{ id, qty }], subtotal, shipping }
     // e.g. call your serverless function that creates a Stripe/Razorpay checkout session
   });
   ```
   Never trust prices from the browser: look them up on the server by product `id`.
3. Review the template text in `privacy.html`, `terms.html` and `shipping.html` with a legal advisor.

## Before launch

- [ ] Replace the sample products and placeholder affiliate URLs
- [ ] Add real product images (`assets/img/`)
- [ ] Moving to a custom domain? Replace `https://iam-anwesh.github.io/thegembyte` in `config.js` (`url`), `sitemap.xml`, `robots.txt` and the canonical/OG tags, and change `<base href>` in `404.html` to `/`
- [ ] Configure form endpoints and analytics
- [ ] Update social links and contact email
