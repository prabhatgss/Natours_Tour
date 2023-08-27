const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  // console.log(tour);

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}//my-tours/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}/my-tours`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
        {
          price_data: {
            currency: 'inr',
            unit_amount: tour.price * 100, // Amount in cents
            product_data: {
              name: `${tour.name} Tour`,
              description: tour.summary,
              images: [
                `https://natours.cyclic.cloud//img/tours/${tour.imageCover}`
              ],
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
  });

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session
  });
});


// exports.createBookingCheckout =catchAsync(async (req,res,next) =>{
//   const {tour,user,price} = req.query;
//   if(!tour && !user && !price) return next();
//   await Booking.create({tour,user,price});
//   res.redirect(req.originalUrl.split('?')[0])
// })
const createBookingCheckout = async session => {
  try {
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });

    const tour = session.client_reference_id;
    const user = (await User.findOne({ email: session.customer_details.email })).id;
    const price = lineItems.data[0].amount_subtotal / 100;

    await Booking.create({ tour, user, price });
  } catch (error) {
    console.error('Error creating booking:', error);
    throw new Error('Booking creation failed');
  }
};

exports.webhookCheckout = async (req, res, next) => {
  const payload = req.rawBody;
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await createBookingCheckout(session);

      res.status(200).json({ received: true });
    }
  } catch (error) {
    console.error('Webhook Error:', error);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

exports.createBooking = factory.createOne(Booking);
exports.getAllBooking = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);