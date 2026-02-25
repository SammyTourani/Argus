// Run once: npx ts-node --esm scripts/setup-stripe.ts
// Or: bun run scripts/setup-stripe.ts
// Creates Argus Pro product and $29/month price in Stripe
// Outputs STRIPE_PRO_PRICE_ID to add to .env

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

async function main() {
  console.log('Creating Stripe products for Argus...\n');

  // Create the product
  const product = await stripe.products.create({
    name: 'Argus Pro',
    description: 'Unlimited builds, priority sandbox, all features included.',
    metadata: { app: 'argus' },
  });

  console.log(`Product created: ${product.id}`);

  // Create the price
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 2900, // $29.00
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { app: 'argus', tier: 'pro' },
  });

  console.log(`Price created: ${price.id}`);
  console.log('\n--- Add to your .env ---');
  console.log(`STRIPE_PRO_PRICE_ID=${price.id}`);
  console.log('------------------------\n');
}

main().catch(console.error);
