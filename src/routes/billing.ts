import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_fake_key_for_dev_change_me', {
  apiVersion: '2026-07-29.dahlia',
});

export const billingRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // POST /api/billing/checkout
  server.post('/checkout', {
    preValidation: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    }
  }, async (request: any, reply) => {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'AgentOS Pro Subscription',
                description: 'Unlimited AI Agent Runs',
              },
              unit_amount: 1500, // $15.00
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        client_reference_id: request.user.id, // Tie the checkout back to the user
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?billing=success`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?billing=cancelled`,
      });

      return reply.send({ url: session.url });
    } catch (err: any) {
      server.log.error('Stripe Checkout Error:', err);
      return reply.status(500).send({ error: 'Failed to create checkout session' });
    }
  });

  // POST /api/billing/webhook
  // This route MUST NOT use JWT auth. Stripe calls this server-to-server.
  server.post('/webhook', {
    config: {
      rawBody: true // Requires fastify-raw-body to populate request.rawBody
    }
  }, async (request, reply) => {
    const sig = request.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_key_change_me';
    let event: Stripe.Event;

    try {
      // Use the raw body buffer to verify the signature
      event = stripe.webhooks.constructEvent((request as any).rawBody, sig as string, webhookSecret);
    } catch (err: any) {
      server.log.error(`Webhook Error: ${err.message}`);
      return reply.status(400).send(`Webhook Error: ${err.message}`);
    }

    const client = await server.pg.connect();
    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const customerId = session.customer as string;

        if (userId) {
          await client.query(
            `UPDATE users SET stripe_customer_id = $1, subscription_status = 'active' WHERE id = $2`,
            [customerId, userId]
          );
        }
      } else if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await client.query(
            `UPDATE users SET subscription_status = 'canceled' WHERE stripe_customer_id = $1`,
            [customerId]
        );
      }
      
      // Return a 200 response to acknowledge receipt of the event
      return reply.status(200).send({ received: true });
    } finally {
      client.release();
    }
  });
};
