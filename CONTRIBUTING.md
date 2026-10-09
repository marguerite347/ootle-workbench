# Contributing to Ootle Workbench

## Reviewed contribution policy

Effective 2026-10-09, the owner has ended automatic enrollment and unrestricted pushes for both Ootle repositories. This supersedes the 2026-10-06 interim policy.

Anyone may contribute through a fork and pull request. Collaborator write access is granted only to trusted developers individually by the owner; agents use their developer's separately authorized identity. Neither requesting access nor repository instructions grant credentials or permissions.

Except for the owner exception below, changes to the product branch must use a pull request with passing required GitHub Actions checks and at least one approving review. Security-sensitive paths require CODEOWNERS approval from @marguerite347. New commits dismiss stale approvals, the latest push needs independent approval, and review conversations must be resolved. Ordinary contributors are subject to these controls; force pushes and branch deletion remain disabled for protected-branch collaborators.

Use feature branches, preserve other contributors' work, and run relevant checks. Do not bypass protections without the owner exception below, approve your own work as an independent reviewer, or claim an unverified deployment. Ordinary contributors require an eligible independent reviewer. Hosting, runtime execution, wallet and production-secret authority remain separate from repository access.

## Owner and owner-agent exception

The owner explicitly exempts `marguerite347` and agents operating through that owner's authorized GitHub identity from the review and required-check merge gates. They may create branches, commit, push directly to the product branch and merge without another per-change repository approval. Run relevant checks and report their results; do not claim unverified success.

GitHub implements this through the repository administrator bypass. Currently only `marguerite347` is an administrator. It cannot distinguish the human owner from an agent using the same account. Ordinary collaborators remain subject to required checks, reviews and CODEOWNERS. A separate agent/bot identity is not automatically exempt and must be authorized explicitly by the owner. Do not share owner credentials with contributors or grant administrator access to create an exception without the owner's instruction.

Automatic enrollment remains closed. This exception does not override an agent host's permission controls or grant unrelated hosting, wallet or secret access. Never force-push or delete shared history without specific authorization.

Target the `ootle` product branch. Coordinate ongoing feature work with its branch owner. The guidance below comes from upstream Remix; Ootle access and review policy is defined above.

## Upstream Remix contributor reference

Everyone is welcome to contribute to Remix's codebase. You can reach us on [Discord](https://discord.gg/MzhfCGstNA) with any questions.

## Development
Remix libraries work closely with [Remix IDE](https://remix.ethereum.org). Each library has a README to explain its application.

When you add code to a library, please add related unit tests.

## Coding style

Use [JavaScript Standard Style](https://standardjs.com/) for the coding style.

## Submitting Pull Requests
For upstream Remix contributions, use its pull-request process. For this Ootle fork, use pull requests under the reviewed contribution policy above. Run relevant checks and report their results.

## Internationalization
Remix supports Internationalization.

### How to contribute translations?
Remix uses CrowdIn to manage translations.  Please DO NOT make a PR on GitHub with translation. To contribute, make an account on [CrowdIn](https://accounts.crowdin.com/register). 

Remix has four projects on CrowdIn
1. [RemixUI](https://crowdin.com/project/remix-ui/) - for translating Remix's User Interface
2. [Remix Docs](https://crowdin.com/project/remix-translation)  - for translating Remix's [Documentation](https://remix-ide.readthedocs.io)
3. [LearnEth](https://crowdin.com/project/remix-learneth) - for translating the tutorials in Remix's tutorial plugin called [Learneth](https://remix.ethereum.org/?#activate=solidity,solidityUnitTesting,LearnEth)
4. [Remix Project Website](https://crowdin.com/project/361d7e8c3b07220fa22e9d5a901b0021) - for translating the info site about [Remix](https://remix.live/)

There are many languages, for each project.  But if you do not see your desired language, send us a note on CrowdIn or in the Remix Discord.

In addition to writing translations, you can also review other's work. 

### How to make your plugin support string internationalization?
First, put the string in the locale file located under `apps/remix-ide/src/app/tabs/locales/en`.
Each json file corresponds to a module. If the module does not exist, then create a new json and import it in the `index.js`.
Then you can replace the string with an intl component. The `id` prop will be the key of this string.
```jsx
<label className="py-2 align-self-center m-0" style={{fontSize: "1.2rem"}}>
-  Learn
+  <FormattedMessage id="home.learn" />
</label>
```
In some cases, jsx may not be acceptable, you can use `intl.formatMessage` .
```jsx
<input
   ref={searchInputRef}
   type="text"
   className="border form-control border-right-0"
   id="searchInput"
-  placeholder="Search Documentation"
+  placeholder={intl.formatMessage({ id: "home.searchDocumentation" })}
   data-id="terminalInputSearch"
/>
```

### How to add another language support?
Let's say you want to add French.

First, create a folder named by the language code which is `fr`.
Then, create a json file, let's say `panel.json`,
```json
{
  "panel.author": "Auteur",
  "panel.maintainedBy": "Entretenu par",
  "panel.documentation": "Documentation",
  "panel.description": "La description"
}
```
Then, create a `index.js` file like this,
```js
import panelJson from './panel.json';
import enJson from '../en';

// There may have some untranslated content. Always fill in the gaps with EN JSON.
// No need for a defaultMessage prop when rendering a FormattedMessage component.
export default Object.assign({}, enJson, {
  ...panelJson,
})
```
Then, import `index.js` in `apps/remix-ide/src/app/tabs/locale-module.js`
```js
import enJson from './locales/en'
import zhJson from './locales/zh'
+import frJson from './locales/fr'

const locales = [
  { code: 'en', name: 'English', localeName: 'English', messages: enJson },
  { code: 'zh', name: 'Chinese Simplified', localeName: '简体中文', messages: zhJson },
+  { code: 'fr', name: 'French', localeName: 'Français', messages: frJson },
]
```
You can find the language's `code, name, localeName` in this link
https://github.com/ethereum/ethereum-org-website/blob/dev/i18n.config.json

### Whether or not to use `defaultMessage`?
If you search `FormattedMessage` or `intl.formatMessage` in this project, you will notice that most only have a `id` prop, but a few of them have a `defaultMessage` prop.

**Why?**

The gaps in an incomplete non-English language will be filled with English. The un-translated content will use English as defaultMessage. That's why we don't need to provide a `defaultMessage` prop each time we render a `FormattedMessage` component.

But in some cases, the `id` prop may not be static. For example,
```jsx
<h6 className="pt-0 mb-1" data-id='sidePanelSwapitTitle'>
 <FormattedMessage id={plugin?.profile.name + '.displayName'} defaultMessage={plugin?.profile.displayName || plugin?.profile.name} />
</h6>
```

Because you can't be sure if there is a matched key in the locale file, it's better to provide a `defaultMessage` prop.

### Should I update the non-English locale json files?
When you are updating an existing English locale json file, then you don't need to add any other languages, because CrowdIn will do it for you.

But if you add a new json file, only then English is needed.
