# Epovest Logbook

Record a deploy, a release or any shipped change in your [Epovest](https://epovest.com) logbook,
**dated in front of your AI visibility curves**, so what moved the numbers can be read afterwards.

With Epovest, businesses make AIs recommend them. From the questions their customers ask to the
sources that shape the answers, everything is measured, dated and verifiable. And everything leads
to action: where to appear, what to fix, and proof of what changed.

## Usage

```yaml
- name: Record the deploy in Epovest
  uses: Epovest/logbook-action@v1
  with:
    api-key: ${{ secrets.EPOVEST_API_KEY }}
    project-id: 019f6a43-8ccc-7c7e-8de8-e065f862c128
    label: Deployed ${{ github.ref_name }} to production
    category: technical
```

A complete workflow, recording every successful production deploy:

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # ... your own deploy steps ...
      - name: Record the deploy in Epovest
        if: success()
        uses: Epovest/logbook-action@v1
        with:
          api-key: ${{ secrets.EPOVEST_API_KEY }}
          project-id: ${{ vars.EPOVEST_PROJECT_ID }}
          label: Production deploy
```

## Inputs

| Input | Required | Default | What it is |
| --- | --- | --- | --- |
| `api-key` | yes | | An Epovest API key with the `write` scope (`epo_...`). Store it as a repository secret. |
| `project-id` | yes | | The UUID of the Epovest project the entry belongs to. |
| `label` | yes | | Short wording of the action: it is what the annotation shows next to the curves. |
| `category` | no | `technical` | One of `content`, `technical`, `translation`, `canon`, `press`, `other`. |
| `notes` | no | the repository, the commit and the run | Free notes. |
| `occurred-at` | no | now | When the action happened, ISO 8601, read as UTC. |
| `quest-id` | no | | The quest of the same project this action moves forward. |
| `api-base` | no | `https://api.epovest.com/v1` | Base URL of the API. |

## Outputs

| Output | What it is |
| --- | --- |
| `entry-id` | The id of the logbook entry that was recorded. |

## Where the key comes from

Create an API key with the `write` scope in your Epovest account, then store it as a repository
secret (`Settings → Secrets and variables → Actions`). The project id is the UUID shown on the
project, also returned by `GET /v1/projects`.

Recording is idempotent on the project, the label and the date: replaying the same workflow returns
the entry already recorded instead of a second copy.

## Reference

- API reference: <https://epovest.com/docs/api.md>
- OpenAPI description: <https://epovest.com/docs/openapi.json>
- MCP server: <https://mcp.epovest.com/mcp>
- SDKs generated from the same description: [npm](https://www.npmjs.com/package/epovest),
  [PyPI](https://pypi.org/project/epovest/),
  [Packagist](https://packagist.org/packages/epovest/epovest-php)

## License

MIT. Epovest is a brand operated by Sels de Rehy, LLC, a limited liability company incorporated in
the State of Delaware, United States.
