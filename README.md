# awmpc_site

## Local static site generation

`static.sh` starts PHP's built-in server on loopback, requests each page through
`wmpc_pager.php?page=...`, and saves the rendered responses as local HTML files.
This preserves the same HTTP query-string behavior used by the remote site.

```sh
bash ./static.sh
```

PHP and curl must be installed. The script tries loopback ports `8765` through
`8785`; set `AWMPC_STATIC_PORT` to require a specific local port.

## PHP Stripe Library Install
    composer require stripe/stripe-php

Need to hardcode stripe secret key into create-donation-session.php to allow stripe flow.
