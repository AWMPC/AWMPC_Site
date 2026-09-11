# awmpc_site

## Local static site generation

`static.sh` starts PHP's built-in server on loopback, requests each page through
`wmpc_pager.php?page=...`, and saves the rendered responses as local HTML files.
This preserves the same HTTP query-string behavior used by the remote site.

```sh
bash ./static.sh
```

PHP and curl must be installed. Set `AWMPC_STATIC_PORT` to use a different local
port when needed.

## PHP Stripe Library Install
    composer require stripe/stripe-php

Need to hardcode stripe secret key into create-donation-session.php to allow stripe flow.
