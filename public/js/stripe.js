const stripe = Stripe('pk_test_51NiWrQSEpNVfPbU6Or5DTJ79fLJRbq4Z2tFZdIwiOBZA19QWDvKVdaHSDe43euZDQ83wICdc3HqedlSRAzGrSS4f00rTu72V6d')

const bookTour = async tourId => {
//   1) Get Checkout Session from API
try {
const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`)
//   2) Create Checkout form + charge the credit card for us
await stripe.redirectToCheckout({
    sessionId: session.data.session.id
  });
} catch (err) {
  console.log(err);
  showAlert('error', err);
}
}

let bookTourBtn = document.querySelector("#book-tour");
console.log(bookTourBtn)
let tourId = bookTourBtn.getAttribute("data-tour-id");
bookTourBtn.addEventListener('click',()=>bookTour(tourId));