// Khai báo kiểu rút gọn cho '@playwright/test' để Monaco gợi ý code (chỉ phần pw-lite hỗ trợ).
export const PW_TYPES = `
declare module '@playwright/test' {
  type Pattern = string | RegExp;
  interface RoleOptions { name?: Pattern; exact?: boolean; level?: number; checked?: boolean; includeHidden?: boolean }
  interface TextOptions { exact?: boolean }
  interface Timeout { timeout?: number }
  interface Locator {
    getByRole(role: 'button'|'link'|'textbox'|'checkbox'|'radio'|'combobox'|'heading'|'row'|'cell'|'columnheader'|'dialog'|'alertdialog'|'listitem'|'list'|'img'|'navigation'|'option'|'listbox'|'menu'|'menuitem'|'tab'|'table'|'alert'|'status'|'group'|'searchbox'|'spinbutton'|'slider'|'grid'|'gridcell'|'region'|'banner'|'main', options?: RoleOptions): Locator;
    getByText(text: Pattern, options?: TextOptions): Locator;
    getByLabel(text: Pattern, options?: TextOptions): Locator;
    getByPlaceholder(text: Pattern, options?: TextOptions): Locator;
    getByAltText(text: Pattern, options?: TextOptions): Locator;
    getByTitle(text: Pattern, options?: TextOptions): Locator;
    getByTestId(id: Pattern): Locator;
    locator(selector: string | Locator, options?: { hasText?: Pattern; has?: Locator }): Locator;
    filter(options: { hasText?: Pattern; hasNotText?: Pattern; has?: Locator; hasNot?: Locator; visible?: boolean }): Locator;
    nth(index: number): Locator; first(): Locator; last(): Locator; and(l: Locator): Locator; or(l: Locator): Locator;
    frameLocator(selector: string): FrameLocator;
    click(options?: Timeout & { button?: 'left'|'right'|'middle'; force?: boolean }): Promise<void>;
    dblclick(options?: Timeout): Promise<void>; hover(options?: Timeout): Promise<void>;
    fill(value: string, options?: Timeout): Promise<void>; clear(): Promise<void>;
    press(key: string, options?: Timeout): Promise<void>; pressSequentially(text: string, options?: Timeout & { delay?: number }): Promise<void>;
    check(options?: Timeout): Promise<void>; uncheck(options?: Timeout): Promise<void>; setChecked(v: boolean): Promise<void>;
    selectOption(values: string | string[] | { value?: string; label?: string; index?: number }, options?: Timeout): Promise<string[]>;
    setInputFiles(files: string | string[] | { name: string; mimeType: string; buffer: unknown } | { name: string; mimeType: string; buffer: unknown }[]): Promise<void>;
    dragTo(target: Locator): Promise<void>; focus(): Promise<void>; blur(): Promise<void>; scrollIntoViewIfNeeded(): Promise<void>;
    textContent(): Promise<string | null>; innerText(): Promise<string>; inputValue(): Promise<string>; getAttribute(name: string): Promise<string | null>;
    isVisible(): Promise<boolean>; isHidden(): Promise<boolean>; isEnabled(): Promise<boolean>; isDisabled(): Promise<boolean>; isChecked(): Promise<boolean>;
    count(): Promise<number>; all(): Promise<Locator[]>; allTextContents(): Promise<string[]>; allInnerTexts(): Promise<string[]>;
    waitFor(options?: Timeout & { state?: 'visible'|'hidden'|'attached'|'detached' }): Promise<void>;
    evaluate<R>(fn: (el: HTMLElement, arg?: any) => R, arg?: unknown): Promise<R>;
  }
  interface FrameLocator { getByRole: Locator['getByRole']; getByText: Locator['getByText']; getByLabel: Locator['getByLabel']; getByPlaceholder: Locator['getByPlaceholder']; getByTestId: Locator['getByTestId']; locator: Locator['locator']; frameLocator(selector: string): FrameLocator }
  interface Dialog { message(): string; type(): string; accept(promptText?: string): Promise<void>; dismiss(): Promise<void>; defaultValue(): string }
  interface Download { suggestedFilename(): string; path(): Promise<string>; saveAs(path: string): Promise<void> }
  interface Page extends Pick<Locator, 'getByRole'|'getByText'|'getByLabel'|'getByPlaceholder'|'getByAltText'|'getByTitle'|'getByTestId'|'locator'|'frameLocator'> {
    goto(url: string, options?: { waitUntil?: 'load'|'domcontentloaded'|'networkidle' }): Promise<null>;
    url(): string; title(): Promise<string>; reload(): Promise<null>; goBack(): Promise<null>; goForward(): Promise<null>;
    waitForTimeout(ms: number): Promise<void>; waitForURL(url: Pattern, options?: Timeout): Promise<void>; waitForLoadState(state?: string): Promise<void>;
    evaluate<R>(fn: (arg?: any) => R, arg?: unknown): Promise<R>; content(): Promise<string>; pause(): Promise<void>; screenshot(options?: { path?: string; fullPage?: boolean }): Promise<unknown>;
    on(event: 'dialog', handler: (dialog: Dialog) => unknown): Page; once(event: 'dialog', handler: (dialog: Dialog) => unknown): Page;
    waitForEvent(event: 'download'): Promise<Download>; waitForEvent(event: 'dialog'): Promise<Dialog>;
    keyboard: { press(key: string): Promise<void>; type(text: string): Promise<void>; down(key: string): Promise<void>; up(key: string): Promise<void> };
    mouse: { click(x: number, y: number): Promise<void>; move(x: number, y: number): Promise<void> };
    context(): BrowserContext;
  }
  interface BrowserContext { pages(): Page[]; newPage(): Promise<Page>; clearCookies(): Promise<void>; storageState(options?: { path?: string }): Promise<unknown> }
  interface Fixtures { page: Page; context: BrowserContext; browserName: 'chromium'|'firefox'|'webkit'; baseURL: string }
  interface TestInfo { title: string }
  type TestBody<T> = (args: Fixtures & T, testInfo: TestInfo) => Promise<void> | void;
  interface TestType<T> {
    (title: string, body: TestBody<T>): void;
    (title: string, details: { tag?: string | string[] }, body: TestBody<T>): void;
    only: TestType<T>; skip(title?: string | boolean, body?: TestBody<T> | string): void; fixme: TestType<T>; fail: TestType<T>; slow(): void;
    describe: { (title: string, fn: () => void): void; only(title: string, fn: () => void): void; skip(title: string, fn: () => void): void; serial(title: string, fn: () => void): void; configure(o: { mode?: 'serial'|'parallel'|'default' }): void };
    beforeEach(fn: TestBody<T>): void; afterEach(fn: TestBody<T>): void; beforeAll(fn: TestBody<T>): void; afterAll(fn: TestBody<T>): void;
    step<R>(title: string, body: () => Promise<R> | R): Promise<R>;
    extend<U>(fixtures: { [K in keyof U]: ((args: Fixtures & T & U, use: (v: U[K]) => Promise<void>) => Promise<void>) | [((args: Fixtures & T & U, use: (v: U[K]) => Promise<void>) => Promise<void>), { scope?: 'test'|'worker'; auto?: boolean }] | U[K] }): TestType<T & U>;
    setTimeout(ms: number): void; use(o: Record<string, unknown>): void; info(): TestInfo;
  }
  interface LocatorMatchers {
    toBeVisible(o?: Timeout): Promise<void>; toBeHidden(o?: Timeout): Promise<void>; toBeEnabled(o?: Timeout): Promise<void>; toBeDisabled(o?: Timeout): Promise<void>;
    toBeChecked(o?: Timeout & { checked?: boolean }): Promise<void>; toBeEditable(o?: Timeout): Promise<void>; toBeFocused(o?: Timeout): Promise<void>; toBeEmpty(o?: Timeout): Promise<void>; toBeAttached(o?: Timeout): Promise<void>; toBeInViewport(o?: Timeout): Promise<void>;
    toHaveText(expected: Pattern | Pattern[], o?: Timeout & { ignoreCase?: boolean }): Promise<void>; toContainText(expected: Pattern | Pattern[], o?: Timeout & { ignoreCase?: boolean }): Promise<void>;
    toHaveValue(v: Pattern, o?: Timeout): Promise<void>; toHaveValues(v: Pattern[], o?: Timeout): Promise<void>; toHaveCount(n: number, o?: Timeout): Promise<void>;
    toHaveAttribute(name: string, value?: Pattern, o?: Timeout): Promise<void>; toHaveClass(v: Pattern, o?: Timeout): Promise<void>; toHaveId(id: string): Promise<void>; toHaveCSS(name: string, value: Pattern): Promise<void>; toHaveAccessibleName(name: Pattern): Promise<void>;
  }
  interface PageMatchers { toHaveURL(url: Pattern, o?: Timeout): Promise<void>; toHaveTitle(title: Pattern, o?: Timeout): Promise<void> }
  interface ValueMatchers { toBe(v: unknown): void; toEqual(v: unknown): void; toMatchObject(v: unknown): void; toBeTruthy(): void; toBeFalsy(): void; toBeNull(): void; toBeUndefined(): void; toBeDefined(): void; toContain(v: unknown): void; toHaveLength(n: number): void; toThrow(e?: Pattern): void; toBeGreaterThan(n: number): void; toBeLessThan(n: number): void; toMatch(p: Pattern): void }
  interface Expect {
    (actual: Locator, o?: Timeout): LocatorMatchers & { not: LocatorMatchers };
    (actual: Page, o?: Timeout): PageMatchers & { not: PageMatchers };
    <V>(actual: V): ValueMatchers & { not: ValueMatchers };
    soft: Expect;
    poll<V>(fn: () => V | Promise<V>, o?: Timeout): ValueMatchers & { not: ValueMatchers };
  }
  export const test: TestType<{}>;
  export const expect: Expect;
  export function defineConfig<T>(c: T): T;
  export function mergeTests<A, B>(a: TestType<A>, b: TestType<B>): TestType<A & B>;
  export const devices: Record<string, Record<string, unknown>>;
  export type { Page, Locator, FrameLocator, BrowserContext, Dialog, Download, TestInfo };
}
`;
