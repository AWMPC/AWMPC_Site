# AWMPC Site

This repository contains the static website served by GitHub Pages. It has no
server-side runtime requirement: the published HTML, JavaScript, CSS, and
assets are served as files.

## Build the site

The Node.js renderer reads the HTML inputs in `templates/` and writes the
complete deployable site into `rendered/`. Node.js 18 or newer is required,
and no package installation is needed.

```sh
npm run build
# or
bash ./static.sh
```

The policy pages are copied from `templates/` into `rendered/`; they are not
processed as page fragments. The Bible reader is hosted by its own site and is
linked externally from the main-site navigation. Run the build after changing
a template or static asset, then deploy the entire `rendered/` directory.
`rendered/` is generated output and can be recreated at any time. It is
intentionally ignored by Git because the Pages workflow generates it fresh for
each deployment.

## External assets

Images, videos, documents, and other large media can be stored in object
storage buckets and served through HTTPS custom domains. To rewrite relative
paths during generation, set both hosts:

```sh
AWMPC_IMAGE_BASE_URL='https://your-image-hostname' \
AWMPC_DATA_BASE_URL='https://your-data-hostname' bash ./static.sh
```

Image `src`, `poster`, and `href` references use the image host. PDF, video,
audio, stylesheet, text, and JSON references use the data host.
Ordinary page navigation remains relative. Leave either variable unset to keep
that asset class's relative paths. Keep object-storage credentials out of this
repository; uploads are a separate deployment step.

The Pages workflow sets the image and data hosts to their respective bucket
custom domains. Legacy references are flattened into the bucket: for example,
`resources/images/banners/example.webp` becomes
`https://images.awmpc.org/banners/example.webp`, and
`resources/documents/hymns/102.pdf` becomes
`https://data.awmpc.org/hymns/102.pdf`. The parent `images/` and `documents/`
directories are not retained in either bucket key.

Because the image and data hosts are separate origins, their public buckets
must allow `GET` requests from `https://awmpc.org` and
`https://www.awmpc.org` through their CORS policies. This is required for the
hymn manifest, PDF.js worker, and browser-loaded PDFs.

The generated site copies local runtime assets such as `resources/` into
`rendered/`. When the data host is unset, it also copies the local hymn
manifest for offline/local rendering; with the Pages data host configured, the
manifest is loaded from
`https://data.awmpc.org/hymns/index.json`. Hymn PDFs remain external data
assets and are not committed to Git.

The Bible reader and its dataset are maintained and deployed separately from
this repository.

The included `.github/workflows/pages.yml` builds and deploys
`rendered/` as a GitHub Pages artifact. It verifies that `rendered/index.html`
is at the artifact root. The workflow uses the Node.js renderer directly and
does not run Jekyll.

For GitHub Pages, the branch-based source picker normally supports the branch
root or `/docs`, not an arbitrary `/rendered` directory. The Actions workflow
is therefore the publishing source for this layout. Configure the custom domain
in the repository's Pages settings; a `CNAME` file is not required for this
workflow.

## License

This is a public repository, but it is not released as an open-source template.
The repository is provided without permission to copy, modify, redistribute,
or reuse its contents as another website. See [LICENSE](LICENSE). Third-party
software, media, trademarks, and other materials retain their own terms.

Public visibility cannot prevent GitHub users from viewing or forking the
repository under GitHub's service terms. If the source must not be viewable,
the repository must be private. This notice is informational and is not legal
advice.

## Security

Stripe uses a browser-safe publishable key in the static donation page. Never
put a Stripe secret key or object-storage credential in this repository or in
client-side code.
