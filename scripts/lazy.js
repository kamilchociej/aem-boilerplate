import { loadCSS } from './aem.js';

/**
 * Creates the StreamX search input in the nav mount point prepared by the header.
 * @param {Element} mount The nav search mount point
 * @param {Object} config The Search Config rows authored in the nav
 */
export default async function loadNavSearch(mount, config) {
  if (!config.searchApiUrl) {
    // eslint-disable-next-line no-console
    console.error('Search Config in the nav is missing "searchApiUrl"');
    return;
  }

  // The results page renders its own input, so the nav input is not needed there.
  if (config.searchPageUrl && window.location.pathname === config.searchPageUrl) {
    mount.remove();
    return;
  }

  // createSearchInput does not load the stylesheet itself.
  loadCSS(`${window.hlx.codeBasePath}/scripts/search/streamx-search.css`);

  const { createSearchInput } = await import('./search/streamx-search-inline.js');

  const queryParam = config.queryParam || 'query';

  createSearchInput({
    searchApiUrl: config.searchApiUrl,
    searchPageUrl: config.searchPageUrl
      ? (query) => `${config.searchPageUrl}?${queryParam}=${encodeURIComponent(query)}`
      : undefined,
    queryParam,
    minSearchLength: Number(config.minSearchLength) || 3,
    namespace: config.namespace || undefined,
    showSearchButton: false,
    suggestionsAsLinks: config.suggestionsAsLinks === 'true',
    labels: {
      inputPlaceholder: config.inputPlaceholder || undefined,
      inputLabel: config.inputLabel || undefined,
      clearButtonAria: config.clearButtonAria || undefined,
    },
  }, mount);
}
