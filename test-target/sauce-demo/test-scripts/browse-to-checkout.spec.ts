// Imported from the pacing fixture, NOT from '@playwright/test' — that import is
// what spaces out page loads so the suite browses at a human pace. See
// pacing.fixture.ts and config.yaml's `pacing` block.
import { test, expect } from './pacing.fixture';
import type { Page } from '@playwright/test';

/**
 * Sauce Demo — browse → add to cart → checkout hand-off.
 *
 * Generated from ../test-cases/sauce-demo-browse-to-checkout-test-cases.md
 * (TC-01 … TC-15). One test per test case; the TC id is kept in the test name
 * so a failure points straight back to the source case.
 *
 * Every locator below was read from the live DOM. Non-obvious ones carry an
 * `// observed:` comment recording what was actually seen on the page.
 *
 * Boundary (config.yaml): the checkout test stops at the Shopify-hosted
 * checkout page. No contact, delivery or payment details are ever entered and
 * no order is placed.
 */

// Clean state per test: the cart is cookie-based and Playwright gives every test
// a fresh browser context, so each test already starts with an empty cart. (A
// /cart/clear step would work too — observed to redirect to /cart and reset the
// counter to (0) — but it costs an extra full page load per test, and this site
// starts issuing bot-verification challenges under rapid automated navigation.)

// observed: header has TWO "My Cart" links (desktop + mobile), each with its own
// counter span — #cart-target-desktop is the unambiguous one.
const cartCount = (page: Page) => page.locator('#cart-target-desktop');

// observed: section.product-grid holds the product cards; div#drawer holds a
// HIDDEN duplicate of the cart markup on every page, so unscoped product/cart
// locators hit strict-mode violations. Always scope.
const productCards = (page: Page) =>
  page.locator('section.product-grid a[href*="/products/"]');

// observed: section#cart is the visible cart; the hidden #drawer copy has a
// second form[action="/cart"], a second "Check Out" input and duplicate ids.
const cart = (page: Page) => page.locator('#cart');

/** Adds one Grey jacket via the PDP — the observed add-to-cart flow. */
async function addGreyJacket(page: Page) {
  await page.goto('/products/grey-jacket');
  await page.getByRole('button', { name: 'Add to Cart' }).click();
  await expect(cartCount(page)).toHaveText('(1)');
}

test('TC-01: Home page loads with branding, tagline, navigation and an empty cart', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Sauce Demo');

  // observed: <h1 id="logo"><a href="/"><img alt="Sauce Demo"></a></h1>
  const logo = page.locator('#logo');
  await expect(logo.getByRole('img', { name: 'Sauce Demo' })).toBeVisible();
  await expect(logo.getByRole('link')).toHaveAttribute('href', '/');

  // observed: <div id="tagline"><h3>Just a demo site showing off what Sauce can do.</h3></div>
  await expect(page.locator('#tagline')).toContainText(
    'Just a demo site showing off what Sauce can do.',
  );

  // observed: main nav is ul#main-menu.accordion inside #sidebar; full item list
  // is Home, Catalog, Blog, About Us, Wish list, Refer a friend, Login, Create account
  const nav = page.locator('#main-menu');
  for (const label of ['Home', 'Catalog', 'Blog', 'About Us', 'Wish list', 'Refer a friend']) {
    await expect(nav.getByRole('link', { name: label, exact: true })).toBeVisible();
  }

  await expect(cartCount(page)).toHaveText('(0)');
  // observed: header <a href="/cart">Check Out</a> — links to the cart, not the checkout
  await expect(page.getByRole('link', { name: 'Check Out' })).toHaveAttribute('href', '/cart');
});

test('TC-02: Home page shows the three featured products with names and prices', async ({
  page,
}) => {
  await page.goto('/');

  const cards = productCards(page);
  await expect(cards).toHaveCount(3);

  // observed: card markup is <a><img class="product"><h3>name</h3><h4>price</h4></a>
  await expect(cards.locator('h3')).toHaveText(['Grey jacket', 'Noir jacket', 'Striped top']);
  await expect(cards.locator('h4')).toHaveText(['£55.00', '£60.00', '£50.00']);

  // observed: home-page cards link to /collections/frontpage/products/<handle>
  for (const handle of ['grey-jacket', 'noir-jacket', 'striped-top']) {
    await expect(
      page.locator(`section.product-grid a[href="/collections/frontpage/products/${handle}"]`),
    ).toBeVisible();
  }
  await expect(cards.locator('img')).toHaveCount(3);
});

test('TC-03: Catalog link in the main navigation opens the all-products collection', async ({
  page,
}) => {
  await page.goto('/');

  await page.locator('#main-menu').getByRole('link', { name: 'Catalog', exact: true }).click();

  await expect(page).toHaveURL('https://sauce-demo.myshopify.com/collections/all');
  await expect(page).toHaveTitle('Products – Sauce Demo');
  await expect(page.getByRole('heading', { name: 'Products', level: 1 })).toBeVisible();
  // observed: <div id="breadcrumb" class="desktop">Home — Products</div> (em dash)
  await expect(page.locator('#breadcrumb')).toHaveText('Home — Products');
});

test('TC-04: Catalog lists all seven products with correct names and prices', async ({ page }) => {
  await page.goto('/collections/all');

  const cards = productCards(page);
  await expect(cards).toHaveCount(7);

  await expect(cards.locator('h3')).toHaveText([
    'Black heels',
    'Bronze sandals',
    'Brown Shades',
    'Grey jacket',
    'Noir jacket',
    'Striped top',
    'White sandals',
  ]);
  // observed: h4 price nodes carry a trailing space ("£45.00 ") — toHaveText normalises it
  await expect(cards.locator('h4')).toHaveText([
    '£45.00',
    '£39.99',
    '£20.00',
    '£55.00',
    '£60.00',
    '£50.00',
    '£25.00',
  ]);

  // observed: no .pagination element on this collection
  await expect(page.locator('.pagination')).toHaveCount(0);
});

test('TC-05: Out-of-stock products are flagged "Sold Out" in the catalog', async ({ page }) => {
  await page.goto('/collections/all');

  // observed: <div class="sold-out">Sold Out</div> inside the card anchor
  const badges = page.locator('section.product-grid .sold-out');
  await expect(badges).toHaveCount(2);

  const soldOutCards = productCards(page).filter({ has: page.locator('.sold-out') });
  await expect(soldOutCards.locator('h3')).toHaveText(['Brown Shades', 'White sandals']);

  // still clickable links to their product pages
  await expect(soldOutCards.nth(0)).toHaveAttribute(
    'href',
    '/collections/all/products/brown-shades',
  );
  await expect(soldOutCards.nth(1)).toHaveAttribute(
    'href',
    '/collections/all/products/white-sandals',
  );

  const inStockCards = productCards(page).filter({ hasNot: page.locator('.sold-out') });
  await expect(inStockCards).toHaveCount(5);
});

test('TC-06: Clicking a catalog product card opens its product detail page', async ({ page }) => {
  await page.goto('/collections/all');

  await productCards(page).filter({ hasText: 'Grey jacket' }).click();

  // observed: catalog cards link to /collections/all/products/<handle>
  await expect(page).toHaveURL(/\/products\/grey-jacket$/);
  await expect(page).toHaveTitle('Grey jacket – Sauce Demo');
  // observed: <form id="product-form"><h1>Grey jacket</h1><h2 id="product-price">£55.00</h2>
  await expect(page.locator('#product-form h1')).toHaveText('Grey jacket');
  await expect(page.locator('#product-price')).toHaveText('£55.00');
});

test('TC-07: Product detail page shows product information and an enabled Add to Cart button', async ({
  page,
}) => {
  await page.goto('/products/grey-jacket');

  await expect(page.locator('#breadcrumb')).toHaveText('Home — Grey jacket');
  await expect(page.locator('#product-form h1')).toHaveText('Grey jacket');
  await expect(page.locator('#product-price')).toHaveText('£55.00');
  await expect(page.getByRole('img', { name: 'Grey jacket' }).first()).toBeVisible();

  // observed: a REAL native <select id="product-select-option-0"> with the single
  // option "Grey jacket" (the hidden #product-select name="id" carries variant 611945025)
  const variant = page.locator('#product-select-option-0');
  await expect(variant).toBeVisible();
  await expect(variant.locator('option')).toHaveText(['Grey jacket']);

  // observed: <input type="submit" value="Add to Cart" id="add" class="btn add-to-cart">
  const addToCart = page.getByRole('button', { name: 'Add to Cart' });
  await expect(addToCart).toBeVisible();
  await expect(addToCart).toBeEnabled();

  // observed: the PDP has NO quantity field — quantity is only editable in the cart
  await expect(page.locator('[name="quantity"]')).toHaveCount(0);
});

test('TC-08: Adding a product from the PDP updates the header cart count without leaving the page', async ({
  page,
}) => {
  await page.goto('/products/grey-jacket');
  await expect(cartCount(page)).toHaveText('(0)');

  // Stamp the window so a full page load (which would wipe it) is detectable.
  await page.evaluate(() => ((window as Window & { __stamp?: boolean }).__stamp = true));

  // observed: Add to Cart is AJAX — the URL does not change and the page does not reload
  await page.getByRole('button', { name: 'Add to Cart' }).click();

  await expect(cartCount(page)).toHaveText('(1)');
  await expect(page).toHaveURL(/\/products\/grey-jacket$/);
  expect(await page.evaluate(() => (window as Window & { __stamp?: boolean }).__stamp)).toBe(true);

  await page.goto('/cart');
  const rows = cart(page).locator('.row').filter({ has: page.locator('input[name="updates[]"]') });
  await expect(rows).toHaveCount(1);
  // observed: line title is "<product> - <variant>" => "Grey jacket - Grey jacket"
  await expect(rows.locator('h3 a')).toHaveText('Grey jacket - Grey jacket');
  await expect(rows.locator('input[name="updates[]"]')).toHaveValue('1');
  // observed: order total is the first <h2> inside section#cart
  await expect(cart(page).locator('h2').first()).toHaveText('Total £55.00');
});

test('TC-09: Adding the same product twice merges into one cart line with quantity 2', async ({
  page,
}) => {
  await page.goto('/products/grey-jacket');

  const addToCart = page.getByRole('button', { name: 'Add to Cart' });
  await addToCart.click();
  await expect(cartCount(page)).toHaveText('(1)');
  await addToCart.click();
  await expect(cartCount(page)).toHaveText('(2)');

  await page.goto('/cart');

  const rows = cart(page).locator('.row').filter({ has: page.locator('input[name="updates[]"]') });
  await expect(rows).toHaveCount(1);
  await expect(rows.locator('h3 a')).toHaveText('Grey jacket - Grey jacket');
  await expect(rows.locator('input[name="updates[]"]')).toHaveValue('2');
  // observed: unit price cell stays £55.00 while the line total becomes £110.00
  await expect(rows.locator('.price')).toHaveText('£55.00');
  await expect(rows.locator('.total')).toHaveText('£110.00');
  await expect(cart(page).locator('h2').first()).toHaveText('Total £110.00');
});

test('TC-10: A sold-out product cannot be added to the cart', async ({ page }) => {
  await page.goto('/collections/all');

  await productCards(page).filter({ hasText: 'Brown Shades' }).click();

  await expect(page).toHaveURL(/\/products\/brown-shades$/);
  await expect(page.locator('#product-price')).toHaveText('£20.00');

  // observed: the same #add input, but value="Sold Out" + disabled="disabled"
  const soldOutButton = page.locator('#add');
  await expect(soldOutButton).toHaveValue('Sold Out');
  await expect(soldOutButton).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Add to Cart' })).toHaveCount(0);

  // force past the actionability check: a real user's click on a disabled control
  // does nothing, and the counter must stay at (0)
  await soldOutButton.click({ force: true });
  await expect(cartCount(page)).toHaveText('(0)');
});

test('TC-11: Selected variant options are carried through to the cart', async ({ page }) => {
  await page.goto('/products/noir-jacket');

  // observed: TWO real native <select>s with <label for=…> — Size
  // (#product-select-option-0: S|M|L) and Color (#product-select-option-1: Blue|Red).
  // Native selects, so selectOption is the right way to drive them.
  const size = page.getByLabel('Size');
  const color = page.getByLabel('Color');
  await expect(size.locator('option')).toHaveText(['S', 'M', 'L']);
  await expect(color.locator('option')).toHaveText(['Blue', 'Red']);

  await size.selectOption('M');
  await color.selectOption('Red');
  await page.getByRole('button', { name: 'Add to Cart' }).click();
  await expect(cartCount(page)).toHaveText('(1)');

  await page.goto('/cart');

  const rows = cart(page).locator('.row').filter({ has: page.locator('input[name="updates[]"]') });
  await expect(rows).toHaveCount(1);
  // observed: variant title reaches the cart as "Noir jacket - M / Red"
  await expect(rows.locator('h3 a')).toHaveText('Noir jacket - M / Red');
  await expect(rows.locator('.price')).toHaveText('£60.00');
  await expect(cart(page).locator('h2').first()).toHaveText('Total £60.00');
});

test('TC-12: Cart page shows correct line item details and order total', async ({ page }) => {
  await addGreyJacket(page); // precondition: cart contains 1 x Grey jacket
  await page.goto('/cart');

  await expect(page).toHaveTitle('Your Shopping Cart – Sauce Demo');
  await expect(page.getByRole('heading', { name: 'My Cart', level: 1 })).toBeVisible();

  // observed: <div class="headers"> with Description / Price / Qty / Total
  const headers = cart(page).locator('.headers');
  for (const label of ['Description', 'Price', 'Qty', 'Total']) {
    await expect(headers).toContainText(label);
  }

  const row = cart(page).locator('.row').filter({ has: page.locator('input[name="updates[]"]') });
  await expect(row.locator('h3 a')).toHaveText('Grey jacket - Grey jacket');
  await expect(row.locator('h4')).toHaveText('Sauce Demo'); // observed: vendor
  await expect(row.locator('.price')).toHaveText('£55.00');
  await expect(row.locator('input[name="updates[]"]')).toHaveValue('1');
  await expect(row.locator('.total')).toHaveText('£55.00');
  await expect(cart(page).locator('h2').first()).toHaveText('Total £55.00');

  // observed: <textarea id="note" placeholder="Add a note to your order...">,
  // <input id="update" value="Update">, <input id="checkout" value="Check Out">
  await expect(cart(page).getByPlaceholder('Add a note to your order...')).toBeVisible();
  await expect(cart(page).getByRole('button', { name: 'Update' })).toBeVisible();
  await expect(cart(page).getByRole('button', { name: 'Check Out' })).toBeVisible();
});

test('TC-13: Updating the quantity in the cart recalculates the totals', async ({ page }) => {
  await addGreyJacket(page); // precondition: cart contains 1 x Grey jacket, total £55.00
  await page.goto('/cart');
  await expect(cart(page).locator('h2').first()).toHaveText('Total £55.00');

  // observed: <input type="text" name="updates[]" id="updates_611945025"> — a TEXT
  // input, no steppers; the id is duplicated by the hidden #drawer copy, hence #cart scoping
  await cart(page).locator('input[name="updates[]"]').fill('3');
  await cart(page).getByRole('button', { name: 'Update' }).click();

  await expect(page).toHaveURL(/\/cart$/);
  const row = cart(page).locator('.row').filter({ has: page.locator('input[name="updates[]"]') });
  await expect(row.locator('input[name="updates[]"]')).toHaveValue('3');
  await expect(row.locator('.price')).toHaveText('£55.00');
  await expect(row.locator('.total')).toHaveText('£165.00');
  await expect(cart(page).locator('h2').first()).toHaveText('Total £165.00');
  await expect(cartCount(page)).toHaveText('(3)');
});

test('TC-14: Removing the only cart line empties the cart', async ({ page }) => {
  await addGreyJacket(page); // precondition: cart contains 1 x Grey jacket
  await page.goto('/cart');

  // observed: the visible remove control is <a href="/cart/change?line=1&quantity=0">x</a>
  // (the hidden #drawer copy of the same link reads "Remove")
  await cart(page).locator('a[href*="/cart/change"]').click();

  await expect(page).toHaveURL(/\/cart$/);
  await expect(cart(page)).toContainText('It appears that your cart is currently empty!');
  await expect(cart(page).getByRole('link', { name: 'Continue Shopping' })).toHaveAttribute(
    'href',
    '/collections/all',
  );

  await expect(cart(page).locator('input[name="updates[]"]')).toHaveCount(0);
  await expect(cart(page).getByRole('button', { name: 'Update' })).toHaveCount(0);
  await expect(cart(page).getByRole('button', { name: 'Check Out' })).toHaveCount(0);
  await expect(cartCount(page)).toHaveText('(0)');
});

test('TC-15: Check Out hands off to the Shopify checkout with the cart total preserved', async ({
  page,
}) => {
  // precondition: cart contains 3 x Grey jacket (order total £165.00)
  await addGreyJacket(page);
  await page.goto('/cart');
  await cart(page).locator('input[name="updates[]"]').fill('3');
  await cart(page).getByRole('button', { name: 'Update' }).click();
  await expect(cart(page).locator('h2').first()).toHaveText('Total £165.00');

  await cart(page).getByRole('button', { name: 'Check Out' }).click();

  // observed: lands on /checkouts/cn/<token>/<locale> — token and locale vary, so match loosely
  await expect(page).toHaveURL(/\/checkouts\//);
  await expect(page).toHaveTitle('Checkout - Sauce Demo');

  // observed h1: "Sauce Demo Checkout"; h2s: Contact, Delivery, Shipping method, Payment
  await expect(page.getByRole('heading', { name: 'Sauce Demo Checkout' }).first()).toBeVisible();
  for (const section of ['Contact', 'Delivery', 'Shipping method', 'Payment']) {
    await expect(page.getByRole('heading', { name: section, exact: true }).first()).toBeVisible();
  }

  // observed: the order summary reads "Order summaryTotal price£165.00"
  await expect(page.getByRole('heading', { name: 'Order summary' }).first()).toBeVisible();
  await expect(page.getByText('£165.00').first()).toBeVisible();

  // The test ends here — nothing is entered and no order is placed.
});
