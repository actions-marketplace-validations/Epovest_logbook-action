'use strict'

const fs = require('fs')

const CATEGORIES = ['content', 'technical', 'translation', 'canon', 'press', 'other']

function input (name) {
  const upper = name.toUpperCase()
  const value = process.env['INPUT_' + upper] ?? process.env['INPUT_' + upper.replace(/-/g, '_')] ?? ''
  return value.trim()
}

function annotate (message) {
  process.stdout.write('::error::' + message.replace(/\r?\n/g, '%0A') + '\n')
}

// Never process.exit() here: a fetch socket may still be closing, and killing the loop mid-flight
// crashes libuv instead of failing the step cleanly. Throw, and let the top level set the code.
function fail (message) {
  annotate(message)
  const error = new Error(message)
  error.reported = true
  throw error
}

function setOutput (name, value) {
  const file = process.env.GITHUB_OUTPUT
  if (file) fs.appendFileSync(file, name + '=' + value + '\n')
}

function defaultNotes () {
  const repo = process.env.GITHUB_REPOSITORY
  if (!repo) return ''
  const sha = (process.env.GITHUB_SHA || '').slice(0, 7)
  const server = process.env.GITHUB_SERVER_URL || 'https://github.com'
  const run = process.env.GITHUB_RUN_ID
  const lines = [repo + (sha ? ' at ' + sha : ''), 'Ref: ' + (process.env.GITHUB_REF || 'unknown')]
  if (run) lines.push('Run: ' + server + '/' + repo + '/actions/runs/' + run)
  return lines.join('\n')
}

async function main () {
  const apiKey = input('api-key')
  const projectId = input('project-id')
  const label = input('label')
  const category = input('category') || 'technical'
  const occurredAt = input('occurred-at')
  const questId = input('quest-id')
  const apiBase = (input('api-base') || 'https://api.epovest.com/v1').replace(/\/+$/, '')

  if (!apiKey) fail('api-key is required. Store your Epovest key as a repository secret and pass it in.')
  if (!projectId) fail('project-id is required.')
  if (!label) fail('label is required: it is what the annotation shows next to your curves.')
  if (!CATEGORIES.includes(category)) {
    fail('category must be one of ' + CATEGORIES.join(', ') + ', got "' + category + '".')
  }

  process.stdout.write('::add-mask::' + apiKey + '\n')

  const body = { category, label }
  const notes = input('notes') || defaultNotes()
  if (notes) body.notes = notes
  if (occurredAt) body.occurred_at = occurredAt
  if (questId) body.quest_id = questId

  const url = apiBase + '/projects/' + encodeURIComponent(projectId) + '/logbook'
  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'epovest-logbook-action'
      },
      body: JSON.stringify(body)
    })
  } catch (error) {
    fail('Could not reach the Epovest API at ' + url + ': ' + error.message)
  }

  const text = await response.text()
  let payload = null
  try { payload = text ? JSON.parse(text) : null } catch (error) { payload = null }

  if (!response.ok) {
    const named = payload && (payload.message || payload.error)
    const message = named
      ? (payload.error ? payload.error + ': ' : '') + (payload.message || '')
      : text.slice(0, 500)
    fail('Epovest answered ' + response.status + '. ' + message)
  }

  const entry = payload && payload.entry ? payload.entry : payload
  const id = entry && entry.id ? entry.id : ''
  setOutput('entry-id', id)
  process.stdout.write('Recorded in the Epovest logbook: ' + label + (id ? ' (' + id + ')' : '') + '\n')
}

main().catch(function (error) {
  if (!error || !error.reported) {
    annotate(error && error.message ? error.message : String(error))
  }
  process.exitCode = 1
})
