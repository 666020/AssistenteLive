(() => {
  const tags = { b: 'strong', i: 'em', u: 'u', s: 's' };
  window.AssistenteLive = window.AssistenteLive || {};
  window.AssistenteLive.appendFormattedText = (element, value) => {
    const source = String(value ?? '');
    const token = /\{(\/)?(b|i|u|s)\}/gi;
    const stack = [{ tag: '', node: element }];
    let cursor = 0;
    for (const match of source.matchAll(token)) {
      if (match.index > cursor) stack.at(-1).node.append(document.createTextNode(source.slice(cursor, match.index)));
      const tag = match[2].toLowerCase();
      if (!match[1]) {
        const node = document.createElement(tags[tag]);
        stack.at(-1).node.append(node);
        stack.push({ tag, node });
      } else {
        const openIndex = stack.map(item => item.tag).lastIndexOf(tag);
        if (openIndex > 0) stack.length = openIndex;
        else stack.at(-1).node.append(document.createTextNode(match[0]));
      }
      cursor = match.index + match[0].length;
    }
    if (cursor < source.length) stack.at(-1).node.append(document.createTextNode(source.slice(cursor)));
    return element;
  };
})();
