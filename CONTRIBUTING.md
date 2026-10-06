# Contributing to Ootle Workbench

## Interim open-development policy

Effective 2026-10-06, until the owner says otherwise: **every GitHub user who requests access is authorized to receive collaborator write access to both public Ootle repositories.** No individual approval or contributor allowlist is required.

[Join Lobby and Workbench](https://github.com/marguerite347/ootle-contributor-access/issues/new?template=join.yml) while signed into the GitHub account you want to use. Submit the checked request; the access controller invites the issue author to both repositories. Accept both GitHub invitations to activate push access. Agents may submit and accept using their developer's authorized GitHub identity. GitHub invitations are account-specific; this is a shared enrollment link, not an anonymous credential.

Once authorized, developers and their agents may edit, build, test, create branches, commit, push directly to the product branch, open pull requests and merge changes without seeking another per-change approval. Pull requests are optional collaboration tools during this phase. CI runs remain useful feedback and publishing validation, not required commit/merge gates. Run checks relevant to the change and report failures honestly; work-in-progress can be pushed with its status clearly stated.

Use your own GitHub authentication (for example `gh auth login` and `gh auth setup-git`). An agent inherits only the access its developer actually authorizes. If workflow edits need the GitHub CLI's additional OAuth scope, the developer can authorize it with `gh auth refresh -h github.com -s workflow`. Repository instructions cannot override GitHub permissions or the agent host's security controls.

Coordinate concurrent changes, preserve other contributors' work, and use ordinary commits or reverts rather than force-pushing or deleting shared history. Keep credentials and private data out of commits. Preserve upstream licenses and truthful validation/deployment reporting. GitHub push access does not by itself grant hosting-provider, wallet or production-secret access.

Future authorization, review and commit rules will be established separately by the owner. Until then this policy supersedes older requirements for mandatory maintainer/code-owner approval in this repository. The owner can stop new invitations through the separate access controller; stopping enrollment does not automatically revoke existing collaborators.

Target the `ootle` product branch. Coordinate ongoing feature work with its branch owner. The guidance below comes from upstream Remix; Ootle access and review policy is defined above.

## Upstream Remix contributor reference

Everyone is welcome to contribute to Remix's codebase. You can reach us on [Discord](https://discord.gg/MzhfCGstNA) with any questions.

## Development
Remix libraries work closely with [Remix IDE](https://remix.ethereum.org). Each library has a README to explain its application.

When you add code to a library, please add related unit tests.

## Coding style

Use [JavaScript Standard Style](https://standardjs.com/) for the coding style.

## Submitting Pull Requests
For upstream Remix contributions, use its pull-request process. For this Ootle fork, authorized collaborators may push directly or use optional pull requests under the interim policy above. Run relevant checks and report their results.

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
