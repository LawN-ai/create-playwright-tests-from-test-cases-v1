# Test Cases — Sauce Demo (browse → add to cart → checkout)

**Site under test:** https://sauce-demo.myshopify.com/ (Shopify demo store, GBP prices)

**Pages in scope:**

| Page | URL |
|---|---|
| Home | https://sauce-demo.myshopify.com/ |
| Catalog (all products) | https://sauce-demo.myshopify.com/collections/all |
| Product detail (PDP) | https://sauce-demo.myshopify.com/products/grey-jacket |
| Cart | https://sauce-demo.myshopify.com/cart |

**Scope note:** these cases cover an anonymous shopper browsing, adding a product and reaching
the checkout hand-off. They deliberately stop at the Shopify-hosted checkout page — no contact,
address or payment details are entered and no order is placed.

**Suggested clean-state step for every test:** navigate to `/cart/clear` (verified: it redirects
to `/cart`, empties the cart and resets the header counter to `(0)`).

All selectors, labels, prices and URLs below were read from the live DOM on 2026-07-29.
Selector evidence and site quirks: see [sauce-demo-site-notes.md](sauce-demo-site-notes.md).

---

## TC-01: Home page loads with branding, tagline, navigation and an empty cart

**Goal:** Verify the store landing page renders its key chrome for a first-time visitor.

**Steps:**
1. Open https://sauce-demo.myshopify.com/.

**Expected results:**
- Page title is **"Sauce Demo"**.
- The header logo image with alt text **"Sauce Demo"** is visible and links to `/`.
- The tagline **"Just a demo site showing off what Sauce can do."** is visible.
- The main navigation shows the links **Home**, **Catalog**, **Blog**, **About Us**, **Wish list**, **Refer a friend**.
- The header shows **My Cart (0)** and a **Check Out** link pointing to `/cart`.

---

## TC-02: Home page shows the three featured products with names and prices

**Goal:** Verify the featured product grid on the home page.

**Steps:**
1. Open https://sauce-demo.myshopify.com/.
2. Inspect the featured product grid.

**Expected results:**
- Exactly **3** product cards are shown.
- The cards are **Grey jacket £55.00**, **Noir jacket £60.00**, **Striped top £50.00**.
- Each card links to `/collections/frontpage/products/<handle>` and shows a product image.

---

## TC-03: Catalog link in the main navigation opens the all-products collection

**Goal:** Verify navigation from home to the catalog.

**Steps:**
1. Open https://sauce-demo.myshopify.com/.
2. Click **Catalog** in the main navigation.

**Expected results:**
- The browser navigates to `https://sauce-demo.myshopify.com/collections/all`.
- Page title is **"Products – Sauce Demo"**.
- The heading **"Products"** is visible.
- Breadcrumb shows **Home — Products**.

---

## TC-04: Catalog lists all seven products with correct names and prices

**Goal:** Verify the catalog grid content.

**Steps:**
1. Open https://sauce-demo.myshopify.com/collections/all.

**Expected results:**
- Exactly **7** product cards are shown (no pagination control is present).
- The cards, in order, are:

  | # | Name | Price |
  |---|---|---|
  | 1 | Black heels | £45.00 |
  | 2 | Bronze sandals | £39.99 |
  | 3 | Brown Shades | £20.00 |
  | 4 | Grey jacket | £55.00 |
  | 5 | Noir jacket | £60.00 |
  | 6 | Striped top | £50.00 |
  | 7 | White sandals | £25.00 |

---

## TC-05: Out-of-stock products are flagged "Sold Out" in the catalog

**Goal:** Verify the sold-out badge appears only on unavailable products.

**Steps:**
1. Open https://sauce-demo.myshopify.com/collections/all.

**Expected results:**
- Exactly **2** cards carry a **"Sold Out"** badge: **Brown Shades** and **White sandals**.
- No other card shows the badge.
- The sold-out cards are still clickable links to their product pages.

---

## TC-06: Clicking a catalog product card opens its product detail page

**Goal:** Verify catalog → PDP navigation.

**Steps:**
1. Open https://sauce-demo.myshopify.com/collections/all.
2. Click the **Grey jacket** card.

**Expected results:**
- The browser navigates to a URL ending in `/products/grey-jacket`.
- Page title is **"Grey jacket – Sauce Demo"**.
- The product heading **"Grey jacket"** and price **£55.00** are shown.

---

## TC-07: Product detail page shows product information and an enabled Add to Cart button

**Goal:** Verify the PDP renders everything a shopper needs to buy.

**Steps:**
1. Open https://sauce-demo.myshopify.com/products/grey-jacket.

**Expected results:**
- Breadcrumb shows **Home — Grey jacket**.
- Product name **"Grey jacket"** is shown as the product heading.
- Price is **£55.00**.
- A product image with alt text **"Grey jacket"** is visible.
- A variant dropdown is present with the single option **"Grey jacket"**.
- The **Add to Cart** button is visible and **enabled**.
- No quantity input exists on the PDP (quantity is only editable in the cart).

---

## TC-08: Adding a product from the PDP updates the header cart count without leaving the page

**Goal:** Verify the add-to-cart action and its AJAX behaviour.

**Preconditions:** cart is empty (header shows `(0)`).

**Steps:**
1. Open https://sauce-demo.myshopify.com/products/grey-jacket.
2. Click **Add to Cart**.

**Expected results:**
- The header cart counter changes from **(0)** to **(1)**.
- The URL stays on `/products/grey-jacket` — the page does **not** navigate or reload.
- Opening `/cart` afterwards shows one line item **"Grey jacket - Grey jacket"** with quantity **1** and total **£55.00**.

---

## TC-09: Adding the same product twice merges into one cart line with quantity 2

**Goal:** Verify duplicate adds are combined rather than listed separately.

**Preconditions:** cart is empty.

**Steps:**
1. Open https://sauce-demo.myshopify.com/products/grey-jacket.
2. Click **Add to Cart**.
3. Click **Add to Cart** again.
4. Open https://sauce-demo.myshopify.com/cart.

**Expected results:**
- The header cart counter shows **(2)**.
- The cart contains exactly **1** line item, **"Grey jacket - Grey jacket"**.
- The quantity field for that line shows **2**.
- Unit price stays **£55.00**; line total and order total are **£110.00**.

---

## TC-10: A sold-out product cannot be added to the cart

**Goal:** Verify the PDP blocks purchase of an out-of-stock item.

**Steps:**
1. Open https://sauce-demo.myshopify.com/collections/all.
2. Click the **Brown Shades** card (badged *Sold Out*).

**Expected results:**
- The PDP for **Brown Shades** opens, price **£20.00**.
- The add-to-cart button is labelled **"Sold Out"** (not "Add to Cart") and is **disabled**.
- Clicking it does nothing: the header cart counter stays **(0)**.

---

## TC-11: Selected variant options are carried through to the cart

**Goal:** Verify variant selection on a multi-option product.

**Preconditions:** cart is empty.

**Steps:**
1. Open https://sauce-demo.myshopify.com/products/noir-jacket.
2. In the **Size** dropdown, select **M**.
3. In the **Color** dropdown, select **Red**.
4. Click **Add to Cart**.
5. Open https://sauce-demo.myshopify.com/cart.

**Expected results:**
- The **Size** dropdown offers **S**, **M**, **L**; the **Color** dropdown offers **Blue**, **Red**.
- The cart shows one line item titled **"Noir jacket - M / Red"**.
- Unit price and order total are **£60.00**.

---

## TC-12: Cart page shows correct line item details and order total

**Goal:** Verify the cart layout and figures for a single item.

**Preconditions:** cart contains 1 × Grey jacket.

**Steps:**
1. Open https://sauce-demo.myshopify.com/cart.

**Expected results:**
- Page title is **"Your Shopping Cart – Sauce Demo"**; heading **"My Cart"** is shown.
- Column headers **Description**, **Price**, **Qty**, **Total** are shown.
- The line item shows product link text **"Grey jacket - Grey jacket"**, vendor **"Sauce Demo"**, price **£55.00**, quantity **1**, line total **£55.00**.
- Order total reads **"Total £55.00"**.
- An order-note field with placeholder **"Add a note to your order..."**, an **Update** button and a **Check Out** button are visible.

---

## TC-13: Updating the quantity in the cart recalculates the totals

**Goal:** Verify quantity edit + Update.

**Preconditions:** cart contains 1 × Grey jacket (order total £55.00).

**Steps:**
1. Open https://sauce-demo.myshopify.com/cart.
2. Replace the quantity value **1** with **3**.
3. Click **Update**.

**Expected results:**
- The page reloads on `/cart` and the quantity field shows **3**.
- Unit price stays **£55.00**; the line total becomes **£165.00**.
- Order total reads **"Total £165.00"**.
- The header cart counter shows **(3)**.

---

## TC-14: Removing the only cart line empties the cart

**Goal:** Verify item removal and the empty-cart state.

**Preconditions:** cart contains 1 × Grey jacket.

**Steps:**
1. Open https://sauce-demo.myshopify.com/cart.
2. Click the remove control (**x**) on the Grey jacket line.

**Expected results:**
- The browser stays on `/cart`.
- The cart body shows **"It appears that your cart is currently empty!"** with a **Continue Shopping** link to `/collections/all`.
- No line items, quantity fields, **Update** or **Check Out** buttons remain in the cart area.
- The header cart counter shows **(0)**.

---

## TC-15: Check Out hands off to the Shopify checkout with the cart total preserved

**Goal:** Verify the checkout hand-off. **No details are entered and no order is placed.**

**Preconditions:** cart contains 3 × Grey jacket (order total £165.00).

**Steps:**
1. Open https://sauce-demo.myshopify.com/cart.
2. Click **Check Out**.

**Expected results:**
- The browser navigates to a checkout URL matching `https://sauce-demo.myshopify.com/checkouts/...`.
- Page title is **"Checkout - Sauce Demo"**.
- The checkout heading **"Sauce Demo Checkout"** and the sections **Contact**, **Delivery**, **Shipping method**, **Payment** are shown.
- The **Order summary** shows **Total price £165.00** — matching the cart total.
- The test ends here; no contact, delivery or payment information is submitted.
