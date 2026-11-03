import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')

test('scanner descriptions retain formatted text, entities and remediation links', () => {
  const parse = require('html-react-parser').default
  const description = '<p>Check <code>owner &amp; admin</code> before <strong>transfer</strong>.</p>'
  const remediation = '<a href="https://example.invalid/remediation">Read the fix</a><br>Then recompile.'
  assert.equal(renderToStaticMarkup(React.createElement('td', null, parse(description))), `<td>${description}</td>`)
  assert.equal(renderToStaticMarkup(React.createElement('td', null, parse(remediation))), '<td><a href="https://example.invalid/remediation">Read the fix</a><br/>Then recompile.</td>')
  assert.equal(renderToStaticMarkup(React.createElement('td', null, parse(''))), '<td></td>')
})

test('loading overlays preserve size, color and the hidden-loading state', () => {
  const { BounceLoader } = require('react-spinners')
  const markup = renderToStaticMarkup(React.createElement(BounceLoader, { color: '#a7b0ae', size: 100, className: 'spinnersLoading' }))
  assert.match(markup, /spinnersLoading/)
  assert.match(markup, /width:100px/)
  assert.match(markup, /#a7b0ae/)
  assert.equal(renderToStaticMarkup(React.createElement(BounceLoader, { loading: false })), '')
})

test('UML transform render-props retain controls and image content', () => {
  const { TransformWrapper, TransformComponent } = require('react-zoom-pan-pinch')
  const markup = renderToStaticMarkup(React.createElement(TransformWrapper, { initialScale: 1 }, ({ zoomIn, zoomOut, resetTransform }) => {
    for (const action of [zoomIn, zoomOut, resetTransform]) assert.equal(typeof action, 'function')
    return React.createElement(TransformComponent, { contentStyle: { zIndex: 2 } }, React.createElement('img', { src: 'data:image/svg+xml;base64,PHN2Zy8+', alt: 'UML fixture' }))
  }))
  assert.match(markup, /UML fixture/)
  assert.match(markup, /z-index:2/)
})
