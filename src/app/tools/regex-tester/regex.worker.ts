const MAX_DISPLAY = 100;

type MatchInfo = {
  fullMatch: string;
  index: number;
  groups: (string | undefined)[];
};

type Segment = {
  text: string;
  isMatch: boolean;
  matchIndex: number;
};

function collectMatches(regex: RegExp, text: string): MatchInfo[] {
  const matches: MatchInfo[] = [];
  if (regex.global) {
    const re = new RegExp(regex.source, regex.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null && matches.length < MAX_DISPLAY) {
      matches.push({ fullMatch: m[0], index: m.index, groups: m.slice(1) });
      if (m[0] === "") re.lastIndex++;
    }
  } else {
    const re = new RegExp(regex.source, regex.flags);
    const m = re.exec(text);
    if (m) matches.push({ fullMatch: m[0], index: m.index, groups: m.slice(1) });
  }
  return matches;
}

function buildSegments(text: string, matches: MatchInfo[]): Segment[] {
  if (matches.length === 0) return [{ text, isMatch: false, matchIndex: -1 }];
  const segments: Segment[] = [];
  let cursor = 0;
  for (let i = 0; i < matches.length; i++) {
    const { index, fullMatch } = matches[i];
    if (index < cursor) continue;
    if (index > cursor) {
      segments.push({ text: text.slice(cursor, index), isMatch: false, matchIndex: -1 });
    }
    segments.push({ text: fullMatch, isMatch: true, matchIndex: i });
    cursor = index + (fullMatch.length || 1);
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), isMatch: false, matchIndex: -1 });
  }
  return segments;
}

function applyReplace(regex: RegExp, text: string, replacement: string): string {
  try {
    const re = new RegExp(regex.source, regex.flags);
    return text.replace(re, replacement);
  } catch {
    return text;
  }
}

self.onmessage = (e: MessageEvent<{ pattern: string; flagStr: string; text: string; replacement: string }>) => {
  const { pattern, flagStr, text, replacement } = e.data;
  try {
    const regex = new RegExp(pattern, flagStr);
    const matches = collectMatches(regex, text);
    const segments = buildSegments(text, matches);
    const replaceResult = applyReplace(regex, text, replacement);
    self.postMessage({ ok: true, matches, segments, replaceResult });
  } catch {
    self.postMessage({ ok: false });
  }
};
