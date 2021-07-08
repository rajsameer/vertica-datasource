import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { HighlightStyle, tags as t } from '@codemirror/highlight';
import { config } from '@grafana/runtime';

// Using https://github.com/one-dark/vscode-one-dark-theme/ as reference for the colors

const chalky = '#e5c07b',
  coral = '#e06c75',
  cursor = '#528bff',
  cyan = '#56b6c2',
  darkBackground = '#111217', // Brightened compared to original to increase contrast
  invalid = '#ffffff',
  ivory = '#abb2bf',
  malibu = '#61afef',
  sage = '#98c379',
  stone = '#7d8799',
  violet = '#c678dd',
  whiskey = '#d19a66',
  lightBackground = '#ffffff',
  lightBackgroundHighlight = '#f4f5f5',
  darkBackgroundHighlight = '#22252b';

let editorBackground = config.theme.isDark ? darkBackground : lightBackground;
let editorBackgroundHighlight = config.theme.isDark ? darkBackgroundHighlight : lightBackgroundHighlight;

// / The editor theme styles for One Dark.
export const oneDarkTheme = EditorView.theme(
  {
    '&': {
      color: ivory,
      backgroundColor: editorBackground,
      width: 'inherit',
      margin: '0px',
      padding: '0px',
    },

    '.cm-content': {
      caretColor: cursor,
    },
    '.cm-scroller': {
      overflow: 'auto',
      minHeight: '270px',
    },

    '&.cm-focused .cm-cursor': { borderLeftColor: cursor },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
      editorBackground: editorBackgroundHighlight,
    },

    '.cm-panels': { backgroundColor: editorBackground, color: ivory },
    '.cm-panels.cm-panels-top': { borderBottom: '2px solid black' },
    '.cm-panels.cm-panels-bottom': { borderTop: '2px solid black' },

    '.cm-searchMatch': {
      backgroundColor: '#72a1ff59',
      outline: '1px solid #457dff',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: '#6199ff2f',
    },

    '.cm-activeLine': { backgroundColor: editorBackgroundHighlight },
    '.cm-selectionMatch': { backgroundColor: '#aafe661a' },

    '.cm-matchingBracket, .cm-nonmatchingBracket': {
      backgroundColor: '#bad0f847',
      outline: '1px solid #515a6b',
    },

    '.cm-gutters': {
      backgroundColor: editorBackground,
      color: stone,
      border: 'none',
    },

    '.cm-activeLineGutter': {
      backgroundColor: editorBackgroundHighlight,
    },

    '.cm-foldPlaceholder': {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#ddd',
    },

    '.cm-tooltip': {
      border: '1px solid #181a1f',
      backgroundColor: editorBackground,
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: editorBackgroundHighlight,
        color: ivory,
      },
    },
  },
  { dark: true }
);

// / The highlighting style for code in the One Dark theme.
export const oneDarkHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: violet },
  { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: coral },
  { tag: [t.function(t.variableName), t.labelName], color: malibu },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: whiskey },
  { tag: [t.definition(t.name), t.separator], color: ivory },
  { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: chalky },
  { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: cyan },
  { tag: [t.meta, t.comment], color: stone },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: stone, textDecoration: 'underline' },
  { tag: t.heading, fontWeight: 'bold', color: coral },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: whiskey },
  { tag: [t.processingInstruction, t.string, t.inserted], color: sage },
  { tag: t.invalid, color: invalid },
]);

// / Extension to enable the One Dark theme (both the editor theme and
// / the highlight style).
export const oneDark: Extension = [oneDarkTheme, oneDarkHighlightStyle];
