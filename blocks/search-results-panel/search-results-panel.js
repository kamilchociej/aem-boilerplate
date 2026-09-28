/* eslint-disable no-underscore-dangle */
import decorateResultsPanel from '../../scripts/search/eds/search-results-panel.js';
import { getHitUrl } from '../../scripts/search/streamx-search-inline.js';

/**
 * Creates an element and sets its text. Text is never parsed as HTML,
 * so indexed content cannot inject markup.
 */
function el(tag, className, text) {
  const element = document.createElement(tag);

  if (className) element.className = className;
  if (text !== undefined && text !== null) element.textContent = String(text);

  return element;
}

/**
 * Highlighted snippets contain <em> tags around matches. Keep those, drop everything else.
 */
function highlightedText(className, content) {
  const raw = (Array.isArray(content) ? content.join(' ') : content ?? '')
    .replace(/\s+/g, ' ')
    .trim();

  const span = el('span', className);

  raw.split(/(<em>.*?<\/em>)/g).forEach((part) => {
    const match = part.match(/^<em>(.*?)<\/em>$/);

    span.append(match ? el('em', null, match[1]) : document.createTextNode(part));
  });

  return span;
}

let suggestionCount = 0;

function suggestionItem(item) {
  const { title } = (item.highlight?.['payload.title'] || item._source.payload) ?? {};
  const link = el('a', 'stx-suggestion__item search-suggestion');

  suggestionCount += 1;

  // The input points aria-activedescendant at this id during keyboard navigation.
  link.id = `search-suggestion-${suggestionCount}`;
  link.href = getHitUrl(item);

  link.append(highlightedText('search-suggestion-title', title));

  return link;
}

function resultItem(item) {
  const { title, fields } = item._source.payload ?? {};
  const { author, date, description } = fields ?? {};

  const article = el('article', 'search-result');
  const link = el('a', 'search-result-title', title ?? '');
  link.href = getHitUrl(item);
  article.append(link);

  if (description) article.append(el('p', 'search-result-description', description));

  const meta = el('div', 'search-result-meta');

  if (author) meta.append(el('span', null, author));
  if (date) meta.append(el('span', null, date));

  if (meta.children.length) article.append(meta);

  return article;
}

function error() {
  const box = el('div', 'stx-results-panel__error');

  box.append(
    el('span', 'stx-results-panel__error-heading', 'Something went wrong.'),
    el('span', 'stx-results-panel__error-text', 'Please try again later'),
  );

  return box;
}

const renderers = {
  // Key is `item-` + the result's `_source.type`.
  'item-page/eds': resultItem,
  suggestionItem,
  error,
};

const callbacks = {
  // Submit the suggestion title, not the title plus snippet text.
  suggestionItemSubmitValue: (item) => item.closest('.search-suggestion')
    ?.querySelector('.search-suggestion-title')?.textContent ?? '',
};

export default function decorate(block) {
  decorateResultsPanel(block, renderers, callbacks);
}
