<?php
# NOTE: hardcode autoload.php location below for this php file to work.
require '../vendor/autoload.php';
# NOTE: set the secret key below for stripe api to work.
\Stripe\Stripe::setApiKey(FILL_ME_IN);

header('Content-Type: application/json');

$YOUR_DOMAIN = 'https://awmpc.org';

$donationValue = abs((int) $_SERVER['HTTP_DONATION_AMOUNT']);

if ($donationValue < 1) {
  http_response_code(400);
  echo json_encode(['error' => 'Donation amount must be at least $1.']);
  exit;
}

$checkout_session = \Stripe\Checkout\Session::create([
  'payment_method_types' => ['card'],
  'line_items' => [[
    'price_data' => [
      'currency' => 'usd',
      'unit_amount' => (string)($donationValue * 100),
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
