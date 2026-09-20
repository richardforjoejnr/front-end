# Playwright Locator Strategy Guide

A consistent, maintainable approach for adding test locators to an application. It provides
clear, actionable patterns that developers can follow when building components.

> Originally written for the Vocovo Portal (React + Ant Design). The conventions are
> framework-agnostic and are the standard for this repository too — see
> [Applying this in this repo](#applying-this-in-this-repo) at the end.

## Executive summary

**Key principles:**

1. **One attribute** — use `data-test` exclusively (NOT `data-testid`)
2. **Hierarchical naming** — follow a consistent pattern that encodes context
3. **Unique identifiers** — every interactive element gets a unique, descriptive `data-test` value
4. **Anti-fragility** — avoid CSS classes, positions, and generated class names

## Current state analysis

### Strengths

- Use of the `data-test` attribute
- Consistent `vocovo-` prefix for component-level elements
- Page Object Model pattern in the test suite
- Component structure (atoms / molecules / organisms)

### Problems to fix

| Issue | Impact | Example |
| --- | --- | --- |
| Mixed `data-test` vs `data-testid` | Confusion about which attribute to use | `getByTestId('loader')` vs `[data-test="vocovo-spinner"]` |
| AntD class coupling | Tests break on library upgrades | `.ant-table-row`, `.ant-modal-content` |
| Hashed CSS modules | Tests break on every rebuild | `.TaskManager-_3569b`, `.sc-ifAKCX` |
| Index-based selectors | Fragile, position-dependent | `.first()`, `.nth(1)`, `.last()` |
| Missing `data-test` on lists | Hard to count items or select specific ones | Table rows without individual IDs |
| Wrapper + child traversal | Fragile to DOM structure changes | `[data-test="toggle-wrapper"] input` |

## The strategy: hierarchical `data-test` naming

### Pattern formula

```
data-test="{scope}-{component}-{variant/action}"
```

Where:

- **scope** — the context (page, feature, or parent component)
- **component** — the UI element type
- **variant/action** — the specific purpose or state (optional but recommended)

### Priority levels

Use these in order of preference:

| Priority | Strategy | When to use | Example |
| --- | --- | --- | --- |
| 1 | Hierarchical `data-test` | All interactive elements | `data-test="users-add-button"` |
| 2 | Playwright `getByRole()` | Semantic elements with unique names | `getByRole('button', { name: 'Export as CSV' })` |
| 3 | Playwright `getByLabel()` | Form inputs with associated labels | `getByLabel('First Name')` |
| 4 | Scoped `data-test` + role | When multiple similar elements exist | `page.locator('[data-test="modal"]').getByRole('button', { name: 'Confirm' })` |

## Naming patterns by element type

### 1. Buttons

Pattern: `{page/feature}-{action}-button`

```jsx
// GOOD - Unique, descriptive
<Button dataTest="users-add-button">Add User</Button>
<Button dataTest="users-export-button">Export CSV</Button>
<Button dataTest="message-cast-create-button">Create</Button>
<Button dataTest="modal-confirm-button">Confirm</Button>
<Button dataTest="modal-cancel-button">Cancel</Button>

// BAD - Generic, not unique
<Button dataTest="vocovo-button">Add User</Button>
<Button dataTest="vocovo-button">Export CSV</Button>
```

Test usage:

```ts
// Direct selection
await page.locator('[data-test="users-add-button"]').click();

// Dynamic selection
const userId = '123';
await page.locator(`[data-test="users-edit-button-${userId}"]`).click();

// Scoped within a row
const row = page.locator(`[data-test="users-row-${userId}"]`);
await row.locator('[data-test="users-edit-button"]').click();
```

### 2. Text inputs, textareas, search fields

Pattern: `{page/feature}-{field-name}-input`

```jsx
// GOOD
<Input dataTest="users-first-name-input" name="firstName" />
<Input dataTest="users-email-input" type="email" />
<Input dataTest="users-search-input" variant="search" />
<Input dataTest="message-cast-description-textarea" type="textarea" />

// BAD
<Input dataTest="vocovo-input" name="firstName" />
```

```ts
await page.locator('[data-test="users-first-name-input"]').fill('John');

// Alternative: use getByLabel if the label is unique
await page.getByLabel('First Name').fill('John');
```

### 3. Password inputs

Pattern: `{page/feature}-password-input`

```jsx
<Input dataTest="login-password-input" type="password" />
<Input dataTest="profile-new-password-input" type="password" />
<Input dataTest="profile-confirm-password-input" type="password" />
```

### 4. Selects / dropdowns

Pattern: `{page/feature}-{field-name}-select`

```jsx
<Select dataTest="users-role-select" />
<Select.Option dataTest="users-role-option-admin" value="admin">Admin</Select.Option>
<Select.Option dataTest="users-role-option-user" value="user">User</Select.Option>
```

```ts
await page.locator('[data-test="users-role-select"]').click();
await page.locator('[data-test="users-role-option-admin"]').click();

// Alternative
await page.locator('[data-test="users-role-select"]').selectOption('admin');
```

### 5. Checkboxes

Pattern: `{page/feature}-{field-name}-checkbox`

```jsx
<Checkbox dataTest="users-mfa-required-checkbox">Enable MFA</Checkbox>
<Checkbox dataTest="users-select-all-checkbox">Select All</Checkbox>
<Checkbox dataTest={`users-select-checkbox-${userId}`}>Select</Checkbox>
```

```ts
await page.locator('[data-test="users-mfa-required-checkbox"]').check();
const isChecked = await page.locator('[data-test="users-mfa-required-checkbox"]').isChecked();
```

### 6. Radio buttons

Pattern: `{page/feature}-{group-name}-radio-{value}`

```jsx
<RadioGroup dataTest="message-cast-delivery-radio-group">
  <Radio dataTest="message-cast-delivery-radio-immediate" value="immediate">Immediate</Radio>
  <Radio dataTest="message-cast-delivery-radio-scheduled" value="scheduled">Scheduled</Radio>
</RadioGroup>
```

### 7. Toggles / switches

Pattern: `{page/feature}-{field-name}-toggle`

```jsx
// GOOD - data-test directly on the interactive element
<Switch dataTest="users-active-toggle" />

// BAD - data-test on a wrapper requiring child traversal
<div data-test="toggle-wrapper">
  <Switch />
</div>
```

### 8. Tables

Pattern: hierarchical structure for complex data

```jsx
<Table dataTest="users-table">
  <thead>
    <tr dataTest="users-table-header">
      <th dataTest="users-table-header-name">Name</th>
      <th dataTest="users-table-header-email">Email</th>
    </tr>
  </thead>
  <tbody dataTest="users-table-body">
    {users.map(user => (
      <tr key={user.id} dataTest={`users-table-row-${user.id}`} data-user-id={user.id}>
        <td dataTest={`users-table-cell-name-${user.id}`}>{user.name}</td>
        <td dataTest={`users-table-cell-email-${user.id}`}>{user.email}</td>
        <td dataTest={`users-table-cell-actions-${user.id}`}>
          <Button dataTest={`users-edit-button-${user.id}`}>Edit</Button>
          <Button dataTest={`users-delete-button-${user.id}`}>Delete</Button>
        </td>
      </tr>
    ))}
  </tbody>
</Table>
```

```ts
// Count rows
const rowCount = await page.locator('[data-test^="users-table-row-"]').count();

// Select a specific cell
const email = await page.locator('[data-test="users-table-cell-email-123"]').textContent();

// Click an action button in a specific row
await page.locator('[data-test="users-edit-button-123"]').click();

// Get all emails
const emails = await page.locator('[data-test^="users-table-cell-email-"]').allTextContents();
```

### 9. Lists (non-table collections)

Pattern: `{page/feature}-list` with identified items

```jsx
<ul dataTest="message-casts-list">
  {messageCasts.map((cast, index) => (
    <li key={cast.id} dataTest={`message-casts-list-item-${cast.id}`} data-index={index}>
      <span dataTest={`message-casts-list-item-title-${cast.id}`}>{cast.title}</span>
      <Button dataTest={`message-casts-list-item-view-button-${cast.id}`}>View</Button>
    </li>
  ))}
</ul>
```

### 10. Modals / dialogs

Pattern: `{feature}-modal` with internal structure

```jsx
<Modal dataTest="users-delete-modal">
  <div dataTest="users-delete-modal-header">
    <h2 dataTest="users-delete-modal-title">Delete User</h2>
  </div>
  <div dataTest="users-delete-modal-body">
    <p dataTest="users-delete-modal-description">Are you sure?</p>
  </div>
  <div dataTest="users-delete-modal-actions">
    <Button dataTest="users-delete-modal-confirm-button">Delete</Button>
    <Button dataTest="users-delete-modal-cancel-button">Cancel</Button>
  </div>
</Modal>
```

```ts
await page.locator('[data-test="users-delete-modal"]').waitFor();
await expect(page.locator('[data-test="users-delete-modal-title"]')).toHaveText('Delete User');
await page.locator('[data-test="users-delete-modal-confirm-button"]').click();
await expect(page.locator('[data-test="users-delete-modal"]')).not.toBeVisible();
```

### 11. Tabs

Pattern: `{page/feature}-tab-{tab-name}`

```jsx
<Tabs dataTest="audio-tabs">
  <TabPane tab="Record" key="record" dataTest="audio-tab-record" />
  <TabPane tab="Upload" key="upload" dataTest="audio-tab-upload" />
</Tabs>
```

```ts
await page.locator('[data-test="audio-tab-upload"]').click();

// Verify the active tab
const activeTab = page.locator('[data-test^="audio-tab-"][aria-selected="true"]');
await expect(activeTab).toHaveAttribute('data-test', 'audio-tab-upload');
```

### 12. Pagination

Pattern: `{page/feature}-pagination` with controls

```jsx
<div dataTest="users-pagination">
  <Button dataTest="users-pagination-prev-button">Previous</Button>
  <span dataTest="users-pagination-info">Page {current} of {total}</span>
  <Button dataTest="users-pagination-next-button">Next</Button>
</div>
```

### 13. Forms

Pattern: `{page/feature}-{entity}-form` with field hierarchy

```jsx
<Form dataTest="users-create-form">
  <FormField>
    <label dataTest="users-create-form-first-name-label">First Name</label>
    <Input dataTest="users-create-form-first-name-input" />
    <span dataTest="users-create-form-first-name-error">Required</span>
  </FormField>
  <div dataTest="users-create-form-actions">
    <Button dataTest="users-create-form-submit-button" type="submit">Create</Button>
    <Button dataTest="users-create-form-cancel-button">Cancel</Button>
  </div>
</Form>
```

### 14. Alerts / notifications

Pattern: `{page/feature}-{type}-alert`

```jsx
<Alert dataTest="users-success-alert" type="success">User created successfully</Alert>
<Alert dataTest="login-error-alert" type="error">Invalid credentials</Alert>
```

### 15. Spinners / loaders

Pattern: `{page/feature}-spinner` or `{page/feature}-loader`

```jsx
<Spinner dataTest="users-spinner" />
<Spinner dataTest="dashboard-devices-spinner" />
```

```ts
await page.locator('[data-test="users-spinner"]').waitFor({ state: 'hidden' });
```

### 16. Breadcrumbs

Pattern: `{page/feature}-breadcrumb` with item hierarchy

```jsx
<Breadcrumb dataTest="locations-breadcrumb">
  <Breadcrumb.Item dataTest="locations-breadcrumb-home"><Link to="/">Home</Link></Breadcrumb.Item>
  <Breadcrumb.Item dataTest="locations-breadcrumb-current">London Office</Breadcrumb.Item>
</Breadcrumb>
```

### 17. Dot menus / action menus

Pattern: `{page/feature}-{item}-menu` with actions

```jsx
<DotMenu dataTest={`users-row-menu-${userId}`}>
  <MenuItem dataTest={`users-row-menu-edit-${userId}`}>Edit</MenuItem>
  <MenuItem dataTest={`users-row-menu-delete-${userId}`}>Delete</MenuItem>
</DotMenu>
```

### 18. Steps / wizards

Pattern: `{page/feature}-step-{number}` with navigation

```jsx
<Steps dataTest="message-cast-create-steps" current={currentStep}>
  <Step title="Message" dataTest="message-cast-create-step-1" />
  <Step title="Recipients" dataTest="message-cast-create-step-2" />
</Steps>

<div dataTest="message-cast-create-navigation">
  <Button dataTest="message-cast-create-back-button">Back</Button>
  <Button dataTest="message-cast-create-next-button">Next</Button>
</div>
```

### 19. Search components

Pattern: `{page/feature}-search`

```jsx
<Search dataTest="users-search" placeholder="Search users..." />
<div dataTest="locations-search-container">
  <Input dataTest="locations-search-input" variant="search" />
  <Button dataTest="locations-search-button">Search</Button>
</div>
```

### 20. Date/time pickers

Pattern: `{page/feature}-{field}-{picker-type}`

```jsx
<DatePicker dataTest="message-cast-delivery-date-picker" />
<TimePicker dataTest="message-cast-delivery-time-picker" />
```

## Page / feature scope naming

### Page-level containers

```jsx
<div dataTest="users-page">
  <header dataTest="users-header">
    <h1 dataTest="users-title">Users</h1>
    <Button dataTest="users-add-button">Add User</Button>
  </header>
  <div dataTest="users-filters">
    <Search dataTest="users-search" />
  </div>
  <div dataTest="users-content">
    <Table dataTest="users-table" />
  </div>
  <footer dataTest="users-footer">
    <Pagination dataTest="users-pagination" />
  </footer>
</div>
```

### Feature scope prefixes

| Feature | Prefix | Example |
| --- | --- | --- |
| Authentication | `login-`, `auth-`, `mfa-` | `login-email-input` |
| Users Management | `users-` | `users-add-button` |
| Locations | `locations-` | `locations-search` |
| Team Members | `team-members-` | `team-members-add-button` |
| Message Casts | `message-cast-`, `message-casts-` | `message-cast-create-button` |
| Audio Library | `audio-` | `audio-tab-record` |
| Events | `events-` | `events-date-filter` |
| Dashboard | `dashboard-` | `dashboard-devices-table` |
| API Tokens | `api-tokens-` | `api-tokens-create-button` |
| Permissions | `permissions-` | `permissions-role-select` |
| Group Configuration | `group-config-` | `group-config-save-button` |
| Task Manager | `task-manager-` | `task-manager-run-button` |
| Profile | `profile-` | `profile-save-button` |
| Settings | `settings-` | `settings-save-button` |

## Dynamic IDs: when and how

Use dynamic IDs when you have multiple instances of the same component, collections where you
need to target a specific item, or repeated UI patterns.

```jsx
// Based on entity ID
<tr dataTest={`users-table-row-${user.id}`}>

// Based on index (when no entity ID exists)
<div dataTest={`message-casts-list-item-${index}`} data-index={index}>

// Based on state / variant
<Button dataTest={`message-cast-${isActive ? 'stop' : 'start'}-button`}>
```

```ts
// Select by specific ID
await page.locator('[data-test="users-table-row-123"]').click();

// Select all matching a pattern
const allRows = page.locator('[data-test^="users-table-row-"]');

// Combine with other attributes
const row = page.locator('[data-test^="users-table-row-"][data-status="active"]');
```

## Component-level implementation

Base components should accept a `dataTest` prop and apply it to the root interactive element:

```jsx
export const Button = ({ children, dataTest, ...props }) => (
  <button data-test={dataTest || 'vocovo-button'} {...props}>
    {children}
  </button>
);
```

Page components pass specific `dataTest` values down:

```jsx
export const UsersPage = () => (
  <div dataTest="users-page">
    <Button dataTest="users-add-button" onClick={handleAdd}>Add User</Button>
    <UsersTable dataTest="users-table" data={users} />
  </div>
);
```

Composite components derive child values from the prop they are given:

```jsx
export const UsersTable = ({ dataTest, data }) => (
  <Table dataTest={dataTest}>
    <tbody dataTest={`${dataTest}-body`}>
      {data.map(user => (
        <tr key={user.id} dataTest={`${dataTest}-row-${user.id}`}>
          <td dataTest={`${dataTest}-cell-name-${user.id}`}>{user.name}</td>
        </tr>
      ))}
    </tbody>
  </Table>
);
```

## Anti-patterns to avoid

**Do not use generic component names** — `dataTest="vocovo-button"` on every button is not unique.

**Do not use CSS classes for locators** — `.user-row .edit-btn` is coupled to styling.

**Do not use AntD internal classes** — `.ant-table-row`, `.ant-modal-content` break on upgrades.

**Do not use generated/hashed classes** — `.Container-abc123` changes on every build.

**Do not rely on position/index** — `.nth(1)` breaks when items reorder.

**Do not put `data-test` on a wrapper and traverse to the child:**

```jsx
// BAD
<div data-test="toggle-wrapper"><input type="checkbox" /></div>
// await page.locator('[data-test="toggle-wrapper"] input').click();

// GOOD
<input type="checkbox" data-test="users-active-toggle" />
// await page.locator('[data-test="users-active-toggle"]').click();
```

**Do not mix `data-test` and `data-testid`** — pick `data-test` and use it everywhere.

## Playwright test patterns

```ts
// 1. Direct selection
await page.locator('[data-test="users-add-button"]').click();

// 2. Scoped selection
const modal = page.locator('[data-test="users-delete-modal"]');
await modal.locator('[data-test="users-delete-modal-confirm-button"]').click();

// 3. Pattern matching
const allRows = page.locator('[data-test^="users-table-row-"]');
const allEditButtons = page.locator('[data-test$="-edit-button"]');

// 4. Combined selectors
const activeRow = page.locator('[data-test^="users-table-row-"][data-status="active"]');

// 5. Fallback to semantic selectors
const form = page.locator('[data-test="users-create-form"]');
await form.getByLabel('First Name').fill('John');
await form.getByRole('button', { name: 'Submit' }).click();
```

## Code review checklist

### For developers (component authors)

- [ ] All interactive elements have a `dataTest` attribute
- [ ] Values follow the `{scope}-{component}-{variant}` pattern
- [ ] Values are unique within their scope
- [ ] Base components accept and apply the `dataTest` prop
- [ ] Table rows and list items have unique IDs (entity ID or index)
- [ ] Modal sub-elements are uniquely identified
- [ ] Form fields are uniquely identified
- [ ] No reliance on CSS classes or library internal classes

### For QA (test authors)

- [ ] Tests use `data-test` selectors (not `getByTestId`)
- [ ] No CSS class selectors (`.ant-*`, `.vocovo-*`)
- [ ] No position-based selectors (`.first()`, `.nth()`, `.last()`)
- [ ] No generated/hashed class selectors
- [ ] Scoping is used to avoid ambiguity
- [ ] Semantic selectors (`getByRole`, `getByLabel`) are used where appropriate
- [ ] Waits are explicit (no `waitForTimeout`)
- [ ] Locators are defined in Page Object getters, not inline

## FAQ

**Q: What if I have the same action on different pages?**
The scope prefix differentiates them: `users-export-button` vs `locations-export-button`.

**Q: What if I have multiple instances of the same component on one page?**
Use dynamic IDs with entity IDs: `users-edit-button-${user.id}`.

**Q: Should I use `data-test` or `data-testid`?**
Always `data-test`. Do not mix attributes.

**Q: When should I use `getByRole()` instead of `data-test`?**
When the element has a unique, stable accessible name and is semantically meaningful
(button, link, menuitem, tab). Prefer explicit `data-test` when the text might change.

**Q: What about non-interactive elements (headers, paragraphs)?**
Add `data-test` to elements tests need to read text from, assert visibility on, or use as
scope containers. Skip purely decorative elements.

**Q: How do I handle conditional rendering?**
Use descriptive IDs that include the state: `users-save-button` vs `users-edit-button`.

**Q: What about third-party components that don't accept `dataTest`?**
Wrap them, then scope within the wrapper in tests.

**Q: What if I'm refactoring existing code?**
Add new `data-test` attributes first, update tests, verify they pass, then remove the old
CSS-based locators.

## Quick reference

```
PATTERN: data-test="{scope}-{component}-{variant}"

BUTTONS:  {page}-{action}-button        users-add-button, users-delete-button-123
INPUTS:   {page}-{field}-input          users-first-name-input, login-email-input
SELECTS:  {page}-{field}-select         users-role-select
TABLES:   {page}-table                  users-table
          {page}-table-row-{id}         users-table-row-123
          {page}-table-cell-{field}-{id}
MODALS:   {feature}-{purpose}-modal     users-delete-modal
          ...-modal-confirm-button      users-delete-modal-confirm-button
LISTS:    {page}-list                   message-casts-list
          {page}-list-item-{id}         message-casts-list-item-abc123
FORMS:    {page}-{entity}-form          users-create-form
          {page}-{entity}-form-{field}-input
          {page}-{entity}-form-submit-button

NEVER USE                          ALWAYS
- CSS classes (.ant-*, .user-row)  - The data-test attribute
- Generated classes (.sc-ifAKCX)   - Unique, descriptive IDs
- Position (.first(), .nth())      - Scope (page/feature) included
- data-testid                      - Entity IDs for dynamic elements
```

## Applying this in this repo

The chat page (`feathers-chat/public/index.html`) follows this guide with the scope `chat`:

| Element | `data-test` |
| --- | --- |
| Page container | `chat-page` |
| Title | `chat-title` |
| Send form | `chat-send-form` |
| Message input | `chat-message-input` |
| Send button | `chat-send-button` |
| Messages heading | `chat-messages-title` |
| Messages list | `chat-messages-list` |
| A message | `chat-messages-list-item-{id}` |
| A message's text | `chat-messages-list-item-text-{id}` |
| A message's delete icon | `chat-messages-list-item-delete-button-{id}` |

`{id}` is the message's MongoDB `_id`. The Playwright suite in `e2e/` sets
`testIdAttribute: 'data-test'` and keeps every locator in a Page Object getter.

### Additional resources

- [Playwright best practices](https://playwright.dev/docs/best-practices)
- [Playwright locators](https://playwright.dev/docs/locators)
