# TheGemByte

A static storefront for curated affiliate products, built so it can grow into a full online store. Plain HTML, CSS and JavaScript: no build step and no dependencies. Host it anywhere (GitHub Pages, Netlify, Cloudflare Pages, S3).

## Live site

Hosted on GitHub Pages at **https://iam-anwesh.github.io/thegembyte/** (Settings → Pages → deploy from `main`, `/ (root)`).

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Open the site through a local server (or VS Code's Live Server), not by double-clicking the HTML files: the catalogue is loaded from JSON files, which browsers block on `file://` pages.

## Structure

| Path | Purpose |
| --- | --- |
| `index.html` | Home: hero, categories, featured, deals, originals, newsletter |
| `shop.html` | Catalogue with search, category/seller/price/stock filters and sorting (state kept in the URL) |
| `product.html?id=…` | Product detail with Product JSON-LD for rich results |
| `cart.html` | Bag for products you sell directly, with a free-shipping progress bar |
| `wishlist.html` | Saved products (kept in the browser) |
| `about`, `contact`, `disclosure`, `privacy`, `terms`, `shipping`, `404` | Content and legal pages |
| `admin/` | **Admin portal** (Sveltia CMS) for editing products, categories and the Amazon tracking ID |
| `assets/data/products.json` | **Catalogue:** products (edited through the admin portal) |
| `assets/data/categories.json` | Categories (edited through the admin portal) |
| `assets/data/settings.json` | Amazon Associates tracking ID (edited through the admin portal) |
| `assets/js/config.js` | **Site settings:** name, currency, form endpoints, checkout |
| `assets/js/app.js` | All storefront logic |
| `assets/css/styles.css` | Styles with light and dark themes |

The header and footer are rendered by `app.js`, so you edit navigation in one place.

## Admin portal

Products, categories and the Amazon tracking ID are managed at **https://iam-anwesh.github.io/thegembyte/admin/**. Each save is a commit to `main`, and GitHub Pages republishes the site about a minute later. The portal is [Sveltia CMS](https://github.com/sveltia/sveltia-cms), loaded from unpkg; its settings are in `admin/config.yml`.

**Sign in** with a GitHub personal access token (one-time setup):

1. On GitHub, open **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. Name it (for example "TheGemByte admin"), pick an expiry, and under **Repository access** choose **Only select repositories → iam-anwesh/thegembyte**.
3. Under **Permissions → Repository permissions**, set **Contents** to **Read and write**.
4. Generate the token, copy it, and paste it into **Sign In Using Access Token** on the admin page. The browser remembers it; treat it like a password.

To give someone else access, add them as a collaborator on the repository and have them create their own token.

What you can edit:

- **Products:** add, edit, reorder or remove products, upload photos (saved to `assets/img/products/`), and set prices, was-prices, ratings and highlights. Amazon URLs must start with `https://www.amazon.com.au/`.
- **Categories:** names, icons and blurbs. Don't change a category's ID once products use it.
- **Site settings:** your Amazon Associates tracking ID (ends in `-22`). It's added as `?tag=…` to every Amazon link.

## Adding products

The easiest way is the admin portal above. To edit by hand instead, add an entry to the `products` list in `assets/data/products.json`.

**Affiliate product** (the button links out to the merchant):

```json
{ "type": "affiliate", "id": "my-product", "name": "…", "brand": "…", "category": "tech",
  "merchant": "Amazon", "affiliateUrl": "https://www.amazon.com.au/dp/ASIN",
  "price": 29.99, "compareAt": 39.99, "rating": 4.5, "reviews": 120,
  "badges": ["Editor's pick"], "featured": true, "image": "assets/img/products/my-product.jpg",
  "summary": "…", "highlights": ["…", "…"] }
```

**Your own product** (goes into the bag): use `type: "store"` and add `sku` and `stock`. Leave out `merchant` and `affiliateUrl`.

Prices can have cents (`29.99`); whole amounts show without them. Only set `compareAt` when the retailer shows a real was-price or RRP, and copy `rating` and `reviews` from the listing, because they appear in search results. If `image` is empty, a coloured placeholder is shown. After adding products, update `sitemap.xml`.

## Affiliate setup

- Set your Amazon Associates tracking ID under **Site settings** in the admin portal (Amazon Australia IDs end in `-22`). It is added as `?tag=…` to every affiliate link that doesn't already have one. You can also set `affiliateParams` in `config.js` for other parameters.
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
