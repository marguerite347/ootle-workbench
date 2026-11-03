import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const ts = require('typescript')

function loadStatusComponent(name) {
  const source = fs.readFileSync(new URL(`../../libs/remix-ui/statusbar/src/lib/components/${name}.tsx`, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText
  const module = { exports: {} }
  const context = React.createContext({})
  vm.runInNewContext(code, { module, exports: module.exports, require: id => {
    if (id === 'react') return React
    if (id === 'react-intl') return { FormattedMessage: ({ id, defaultMessage }) => defaultMessage || id, useIntl: () => ({ formatMessage: ({ id }) => id }) }
    if (id === '@remix-ui/helper') return { CustomTooltip: ({ children }) => children }
    if (id === '@remix-ide/tracking') return { TrackingContext: context }
    if (id.endsWith('.css')) return {}
    throw new Error(`Unexpected component dependency: ${id}`)
  } })
  return module.exports.default
}

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

test('status popover keeps keyboard trigger semantics and floating accessibility/position props', () => {
  const Trigger = loadStatusComponent('scamAlertStatus')
  const Details = loadStatusComponent('scamDetails')
  const refs = { setReference() {}, setFloating() {} }
  const trigger = renderToStaticMarkup(React.createElement(Trigger, { refs, getReferenceProps: () => ({ 'aria-expanded': true, 'aria-controls': 'scamDetails' }) }))
  assert.match(trigger, /<button type="button"/)
  assert.match(trigger, /aria-controls="scamDetails"/)
  const markup = renderToStaticMarkup(React.createElement(Details, { refs, floatStyle: { position: 'fixed', transform: 'translate(20px, 30px)', left: 0, top: 0 }, getFloatingProps: props => ({ role: 'dialog', ...props }), scamAlerts: [] }))
  assert.match(markup, /role="dialog"/)
  assert.match(markup, /aria-label="Scam alerts"/)
  assert.match(markup, /position:fixed/)
  assert.match(markup, /transform:translate\(20px, 30px\)/)
  assert.match(markup, /No scam alerts are currently loaded/)
})
