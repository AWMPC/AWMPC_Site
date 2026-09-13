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

The standalone Bible reader and policy pages are copied from `templates/` into
`rendered/`; they are not processed as page fragments. Run the build after
changing a template or static asset, then deploy the entire `rendered/`
directory. `rendered/` is generated output and can be recreated at any time.

## External assets

Images, videos, documents, and other large media can be stored in an object
storage bucket and served through its HTTPS custom domain. To rewrite relative
media paths during generation, set `AWMPC_ASSET_BASE_URL`:

```sh
AWMPC_ASSET_BASE_URL='https://your-asset-hostname' bash ./static.sh
```

Only media/document `src`, `poster`, and `href` references are rewritten;
ordinary page navigation remains relative. Leave the variable unset to keep
relative asset paths. Keep object-storage credentials out of this repository;
uploads are a separate deployment step.

The generated site also copies local runtime assets such as `resources/`,
the hymns manifest, `bible.html`, `manifest.json`, and `sw.js` into `rendered/`
so that directory can be deployed as a self-contained site. Large hymn PDFs
remain external deployment assets and are not committed to Git.

The Bible dataset is intentionally not committed to Git. Provide it separately
through the eventual object-storage deployment and update the Bible reader's
data URL before publishing it.

The included `.github/workflows/jekyll-gh-pages.yml` builds and deploys
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
