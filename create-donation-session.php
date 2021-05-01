<?php
# NOTE: hardcode autoload.php location below for this php file to work.
require '../vendor/autoload.php';
# NOTE: set the secret key below for stripe api to work.
\Stripe\Stripe::setApiKey(FILL_ME_IN);

header('Content-Type: application/json');

$YOUR_DOMAIN = 'https://awmpc.org';

$donationValue = $_SERVER['HTTP_DONATION_AMOUNT'];

$checkout_session = \Stripe\Checkout\Session::create([
  'payment_method_types' => ['card'],
  'line_items' => [[
    'price_data' => [
        'currency' => 'usd',
        'unit_amount' => (string)((int) $donationValue * 100),
        'product_data' => [
            'name' => 'User Submitted Donation',
      ],
    ],
    'quantity' => 1,
  ]],
  'mode' => 'payment',
  'success_url' => $YOUR_DOMAIN . '/donation_thank_you.html',
  'cancel_url' => $YOUR_DOMAIN . '/support.html',
]);

echo json_encode(['id' => $checkout_session->id]);
