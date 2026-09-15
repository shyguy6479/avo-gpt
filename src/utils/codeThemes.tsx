import React from 'react';

export type CodeThemeId =
  | 'github-dark'
  | 'dracula'
  | 'monokai'
  | 'one-dark'
  | 'nord'
  | 'synthwave'
  | 'solarized'
  | 'github-light';

export interface CodeTheme {
  id: CodeThemeId;
  name: string;
  bgClass: string;
  borderClass: string;
  headerBg: string;
  headerText: string;
  lineNoColor: string;
  defaultTextColor: string;
  colors: {
    keyword: string;
    string: string;
    number: string;
    comment: string;
    function: string;
    operator: string;
    type: string;
    boolean: string;
  };
  previewColors: [string, string, string]; // 3 representative dots
}

export const CODE_THEMES: Record<CodeThemeId, CodeTheme> = {
  'github-dark': {
    id: 'github-dark',
    name: 'Dark Syntax',
    bgClass: 'bg-[#0d1117]',
    borderClass: 'border-[#30363d]',
    headerBg: 'bg-[#161b22]',
    headerText: 'text-[#c9d1d9]',
    lineNoColor: 'text-[#484f58]',
    defaultTextColor: '#c9d1d9',
    colors: {
      keyword: '#ff7b72',
      string: '#a5d6ff',
      number: '#79c0ff',
      comment: '#8b949e',
      function: '#d2a8ff',
      operator: '#ff7b72',
      type: '#ffa657',
      boolean: '#79c0ff',
    },
    previewColors: ['#ff7b72', '#a5d6ff', '#d2a8ff'],
  },
  dracula: {
    id: 'dracula',
    name: 'Dracula',
    bgClass: 'bg-[#282a36]',
    borderClass: 'border-[#44475a]',
    headerBg: 'bg-[#21222c]',
    headerText: 'text-[#f8f8f2]',
    lineNoColor: 'text-[#6272a4]',
    defaultTextColor: '#f8f8f2',
    colors: {
      keyword: '#ff79c6',
      string: '#f1fa8c',
      number: '#bd93f9',
      comment: '#6272a4',
      function: '#50fa7b',
      operator: '#ff79c6',
      type: '#8be9fd',
      boolean: '#bd93f9',
    },
    previewColors: ['#ff79c6', '#f1fa8c', '#50fa7b'],
  },
  monokai: {
    id: 'monokai',
    name: 'Monokai Pro',
    bgClass: 'bg-[#272822]',
    borderClass: 'border-[#3e3d32]',
    headerBg: 'bg-[#1e1f1c]',
    headerText: 'text-[#f8f8f2]',
    lineNoColor: 'text-[#75715e]',
    defaultTextColor: '#f8f8f2',
    colors: {
      keyword: '#f92672',
      string: '#e6db74',
      number: '#ae81ff',
      comment: '#75715e',
      function: '#a6e22e',
      operator: '#f92672',
      type: '#66d9ef',
      boolean: '#ae81ff',
    },
    previewColors: ['#f92672', '#a6e22e', '#e6db74'],
  },
  'one-dark': {
    id: 'one-dark',
    name: 'One Dark Pro',
    bgClass: 'bg-[#282c34]',
    borderClass: 'border-[#3e4451]',
    headerBg: 'bg-[#21252b]',
    headerText: 'text-[#abb2bf]',
    lineNoColor: 'text-[#5c6370]',
    defaultTextColor: '#abb2bf',
    colors: {
      keyword: '#c678dd',
      string: '#98c379',
      number: '#d19a66',
      comment: '#5c6370',
      function: '#61afef',
      operator: '#56b6c2',
      type: '#e5c07b',
      boolean: '#d19a66',
    },
    previewColors: ['#c678dd', '#61afef', '#98c379'],
  },
  nord: {
    id: 'nord',
    name: 'Nord',
    bgClass: 'bg-[#2e3440]',
    borderClass: 'border-[#434c5e]',
    headerBg: 'bg-[#242933]',
    headerText: 'text-[#d8dee9]',
    lineNoColor: 'text-[#4c566a]',
    defaultTextColor: '#d8dee9',
    colors: {
      keyword: '#81a1c1',
      string: '#a3be8c',
      number: '#b48ead',
      comment: '#616e88',
      function: '#88c0d0',
      operator: '#81a1c1',
      type: '#8fbcbb',
      boolean: '#b48ead',
    },
    previewColors: ['#81a1c1', '#88c0d0', '#a3be8c'],
  },
  synthwave: {
    id: 'synthwave',
    name: "Synthwave '84",
    bgClass: 'bg-[#262335]',
    borderClass: 'border-[#34294f]',
    headerBg: 'bg-[#1a1528]',
    headerText: 'text-[#f3eefc]',
    lineNoColor: 'text-[#614d85]',
    defaultTextColor: '#f3eefc',
    colors: {
      keyword: '#fe4450',
      string: '#fede5d',
      number: '#36f9f6',
      comment: '#848bbd',
      function: '#ffb86c',
      operator: '#fe4450',
      type: '#fe4450',
      boolean: '#36f9f6',
    },
    previewColors: ['#fe4450', '#fede5d', '#36f9f6'],
  },
  solarized: {
    id: 'solarized',
    name: 'Solarized Dark',
    bgClass: 'bg-[#002b36]',
    borderClass: 'border-[#073642]',
    headerBg: 'bg-[#00212b]',
    headerText: 'text-[#839496]',
    lineNoColor: 'text-[#586e75]',
    defaultTextColor: '#839496',
    colors: {
      keyword: '#859900',
      string: '#2aa198',
      number: '#d33682',
      comment: '#586e75',
      function: '#268bd2',
      operator: '#859900',
      type: '#b58900',
      boolean: '#d33682',
    },
    previewColors: ['#859900', '#268bd2', '#2aa198'],
  },
  'github-light': {
    id: 'github-light',
    name: 'Light Syntax',
    bgClass: 'bg-[#ffffff]',
    borderClass: 'border-[#d0d7de]',
    headerBg: 'bg-[#f6f8fa]',
    headerText: 'text-[#24292f]',
    lineNoColor: 'text-[#8c959f]',
    defaultTextColor: '#24292f',
    colors: {
      keyword: '#cf222e',
      string: '#0a3069',
      number: '#0550ae',
      comment: '#6e7781',
      function: '#8250df',
      operator: '#cf222e',
      type: '#953800',
      boolean: '#0550ae',
    },
    previewColors: ['#cf222e', '#8250df', '#0550ae'],
  },
};

export const CODE_THEME_LIST = Object.values(CODE_THEMES);

/**
 * Tokenize a single line of code and render colored span elements according to theme.
 */
export function renderHighlightedLine(line: string, theme: CodeTheme): React.ReactNode {
  if (!line) return '\n';

  const TOKEN_REGEX =
    /(\/\/.*|\/\*[\s\S]*?\*\/|#.*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b(?:const|let|var|function|return|if|else|for|while|import|export|from|class|extends|interface|type|async|await|try|catch|new|this|typeof|instanceof|switch|case|break|default|yield|in|of|struct|fn|pub|use|def|self|select|where|insert|update|delete|create|table)\b)|(\b(?:true|false|null|undefined|None|True|False|nil)\b)|(\b\d+(?:\.\d+)?\b)|(\b[a-zA-Z_]\w*(?=\s*\())|(\b[A-Z]\w*\b)|([+\-*/%=&|^~<>!?:]+)/g;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TOKEN_REGEX.exec(line)) !== null) {
    // Text prior to the match
    if (match.index > lastIndex) {
      elements.push(
        <span key={`txt-${lastIndex}`} style={{ color: theme.defaultTextColor }}>
          {line.slice(lastIndex, match.index)}
        </span>
      );
    }

    const [
      fullMatch,
      comment,
      str,
      keyword,
      booleanVal,
      num,
      funcName,
      typeOrClass,
      operator,
    ] = match;

    let color = theme.defaultTextColor;
    let fontWeight = 'normal';

    if (comment) {
      color = theme.colors.comment;
    } else if (str) {
      color = theme.colors.string;
    } else if (keyword) {
      color = theme.colors.keyword;
      fontWeight = '600';
    } else if (booleanVal) {
      color = theme.colors.boolean;
      fontWeight = '600';
    } else if (num) {
      color = theme.colors.number;
    } else if (funcName) {
      color = theme.colors.function;
      fontWeight = '600';
    } else if (typeOrClass) {
      color = theme.colors.type;
    } else if (operator) {
      color = theme.colors.operator;
    }

    elements.push(
      <span key={`tok-${match.index}`} style={{ color, fontWeight }}>
        {fullMatch}
      </span>
    );

    lastIndex = match.index + fullMatch.length;
  }

  // Trailing text after last match
  if (lastIndex < line.length) {
    elements.push(
      <span key={`txt-${lastIndex}`} style={{ color: theme.defaultTextColor }}>
        {line.slice(lastIndex)}
      </span>
    );
  }

  return elements.length > 0 ? elements : <span style={{ color: theme.defaultTextColor }}>{line}</span>;
}
