# Sauce Demo — observed DOM notes and quirks

Companion to [sauce-demo-browse-to-checkout-test-cases.md](sauce-demo-browse-to-checkout-test-cases.md).
Everything here was read from the live pages on 2026-07-29 with a browser (not inferred), so the
test cases can be automated without a second exploration pass.

No bot protection, CAPTCHA or login is needed — the four pages in scope load anonymously, so a
plain headless Playwright config is enough.

## Header / global chrome (all pages)

| Thing | Observed |
|---|---|
| Cart counter (desktop) | `<a href="#" class="toggle-drawer cart desktop">My Cart <span id="cart-target-desktop" class="count cart-target"><span class="count">(1)</span></span></a>` |
| Cart counter (mobile) | `<a href="/cart" class="cart mobile cart-target">My Cart <span id="cart-target-mobile">…(1)</span></a>` — **duplicate "My Cart" link**, so a `getByRole('link', { name: 'My Cart' })` locator matches **2** elements |
| Header "Check Out" link | `<a href="/cart">Check Out` — goes to the cart page, not the checkout |
| Search | `<form action="/search" method="get">` with `input[name="q"]` placeholder `Search` |
| Main nav | Home `/`, Catalog `/collections/all`, Blog `/blogs/news`, About Us `/pages/about-us`, Wish list `#sauce-show-wish-list`, Refer a friend `#sauce-show-refer-friend` |
| Tagline | `<h3>` containing "Just a demo site showing off what Sauce can do." inside `div#tagline` |

## Product grids (home page and `/collections/all`)

- Container: `section.product-grid` inside `div#page-content`.
- Each card is an `<a id="product-N" class="animated fadeInUpBig">` containing
  `<img class="product" alt="<name>">`, `<h3><name></h3>`, `<h4><price></h4>`.
- Sold-out badge: `<div class="sold-out">Sold Out</div>` inside the card.
- Home page card hrefs use `/collections/frontpage/products/<handle>`; catalog card hrefs use
  `/collections/all/products/<handle>`. Both resolve to the same product.

## Product detail page

- Form: `<form action="/cart/add" method="post" id="product-form">`.
- Title: `#product-form h1`. Price: `#product-price .product-price`.
- Add to cart button: `<input type="submit" value="Add to Cart" id="add" class="btn add-to-cart">`
  → role `button`, accessible name **"Add to Cart"**.
- Sold out variant of the same button: `value="Sold Out"`, `class="btn add-to-cart disabled"`,
  `disabled="disabled"`.
- **Variant dropdowns are real native `<select>` elements**, so `selectOption` works:
  - Grey jacket: one unlabelled `select#product-select-option-0` with a single option `Grey jacket`.
  - Noir jacket: `select#product-select-option-0` labelled **Size** (`S`, `M`, `L`) and
    `select#product-select-option-1` labelled **Color** (`Blue`, `Red`) — both have a real
    `<label for=…>`, so `getByLabel('Size')` / `getByLabel('Color')` work.
  - `select#product-select` (`name="id"`) is the hidden variant-id select
    (`style="display: none"`) — do not drive it directly.
- **No quantity input on the PDP.** Quantity is only editable on the cart page.
- Add to Cart is **AJAX**: the URL does not change and the page does not reload; only the header
  counter updates. Assert on the counter text, not on navigation.
- Product handles observed: `grey-jacket` (variant id `611945025`), `noir-jacket`
  (`611952521` = S/Blue, `7295557889` = M/Blue, `7295558017` = L/Blue, `7805229441` = S/Red,
  `7805236929` = M/Red, `7805238401` = L/Red), `brown-shades` (`1063105029`, sold out).

## Cart page

- Main cart container: `section#cart`. Heading `<h1>My Cart</h1>`. Order total is the first
  `<h2>` inside it, e.g. `Total £55.00`.
- Line item rows: `#cart .row` — **but `.row` also matches the totals row**, so filter on rows
  that contain `input[name="updates[]"]`.
- Quantity field: `<input type="text" name="updates[]" id="updates_<variantId>" value="1">`
  — a **text** input, not `type="number"`; there are no +/- steppers. Fill it then submit.
- Remove control: `<a href="/cart/change?line=N&quantity=0">x</a>` — the visible link text is
  literally **`x`**.
- Buttons: `input#update[value="Update"]`, `input#checkout[value="Check Out"]`.
- Order note: `textarea#note` placeholder `Add a note to your order...`.
- Continue shopping: `<a href="/collections/all">« Continue Shopping</a>`.
- Empty state: `section#cart` becomes
  `<p>It appears that your cart is currently empty! <a href="/collections/all">Continue Shopping</a>.</p>`.
- Cart line ordering is **not** simply append-order (adding Noir jacket after Grey jacket put Noir
  on line 1). Locate rows by product name, never by index.

## Checkout hand-off

- Clicking **Check Out** navigates to `https://sauce-demo.myshopify.com/checkouts/cn/<token>/<locale>?…`
  (locale observed: `en-au`). Assert with a regex like `/\/checkouts\//`, never a literal URL.
- Page title **"Checkout - Sauce Demo"**; observed headings: `h1 "Sauce Demo Checkout"`,
  then `h2` **Contact**, **Delivery**, **Shipping method**,
  **Payment**, **Finalize order**, plus `h2 "Order summary"` whose text reads
  `Order summaryTotal price£165.00`.
- This is Shopify's own hosted checkout — treat it as a third-party boundary. Tests should assert
  arrival and the carried-over total, then stop.

## Gotchas that will bite an automated test

1. **A hidden duplicate of the cart exists in the DOM.** `div#drawer` holds a second copy of the
   cart markup on every page, including a **second `form[action="/cart"]`**, a second
   `input[value="Check Out"]`, a second `Remove` link, and a **duplicate `id="updates_<variantId>"`**
   (two elements share that id). Unscoped locators hit Playwright strict-mode violations — scope
   cart locators to `#cart`, and product-grid locators to `section.product-grid` / `#page-content`.
2. **The mini-cart drawer is broken on this demo.** Clicking the header **My Cart** link
   (`href="#"`, class `toggle-drawer`) opens `#drawer`, which shows only a spinner and never loads
   content (still empty after 3 s). Do not write tests against the drawer — navigate to `/cart`.
3. **Data quirk:** the catalog card named **"Black heels"** links to
   `/collections/all/products/flower-print-jeans`. Match products by visible name, and don't assume
   name and handle agree.
4. `/cart/clear` empties the cart and redirects to `/cart` — the cheapest per-test reset.
5. Prices are GBP with a `£` symbol and the theme leaves a trailing space in some price nodes
   (e.g. `"£55.00 "`). Prefer `toContainText` / trimmed comparisons over exact `toHaveText`.
6. The cart is cookie-based per browser context, so Playwright's default fresh context per test
   already isolates tests from each other.
