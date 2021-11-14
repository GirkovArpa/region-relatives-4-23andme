'use strict';

tryCatch(main);

function main() {
  const stylesheet = document.createElement('style');
  document.body.append(stylesheet);

  const profileData = tryCatch(scrapeProfileData);
  console.log("Here's your profile data.  Click to expand:");
  console.log(profileData);

  const regions = tryCatch(() => extractRegions(profileData));
  console.log("Here's your regions.  Click to expand:");
  console.log(regions);

  tryCatch(() => updateVisibleUI(regions, stylesheet));

  document.addEventListener('click', ({ target: el }) => {
    tryCatch(() => {
      if (el.matches('.accordion-trigger *')) {
        updateHiddenUI(regions, stylesheet);
      }
    });
  });
}

/**
 * Greps an object literal representing profile data
 * from a function body, converts it to an actual
 * object with `eval()`, and returns it.
 */
function scrapeProfileData() {
  const { _callbacks: cbs } = window.TTAM;
  const cb = cbs.find((cb) =>
    cb
      .toString()
      .includes(
        'new exports.reports.ancestryCompositionHD.ACOneWorldMapCoordinator'
      )
  );
  const fnBody = cb.toString();
  const regex = /(?<=new exports\.reports\.ancestryCompositionHD\.ACOneWorldMapCoordinator).+(?=;)/s;
  const objLiteral = fnBody.match(regex)[0];
  const obj = eval(objLiteral);
  return obj;
}

/**
 * @returns {Regions}
 */
function extractRegions(profileData) {
  return profileData.populationTree.children
    .map((child) =>
      child.children.map((child) =>
        child.children.map((child) =>
          child.countries.map((country) => country.aggregations)
        )
      )
    )
    .flat(Infinity);
}

/**
 * @param {Regions} regions
 * @param {HTMLElement} stylesheet
 */
function updateVisibleUI(regions, stylesheet) {
  const regionElementSelector =
    '.country-name.js-country-name-group.js-country-group.b3';
  const regionElements = [...document.querySelectorAll(regionElementSelector)];

  regionElements.forEach((el) => {
    tryCatch(() => {
      const regionText = el.querySelector('strong')?.textContent;

      if (regionText === undefined) {
        return;
      }

      el.id = regionText.replace(/\s/g, '-').toLowerCase();
      const num_relatives = regions.find(
        (region) => region.state === regionText
      )?.num_relatives;

      const selector = `#${el.id}::after`;
      const rule = `${selector} { content: '(${num_relatives} relatives)'; }`;
      updateStylesheet(stylesheet, selector, rule);
    });
  });
}

/**
 * @param {Regions} regions
 * @param {HTMLElement} stylesheet
 */
function updateHiddenUI(regions, stylesheet) {
  const regionElementSelector = 'button[data-subregion-id]';
  const regionElements = [...document.querySelectorAll(regionElementSelector)];

  regionElements.forEach((el) => {
    tryCatch(() => {
      const { subregionId } = el.dataset;

      const num_relatives = regions.find(
        (region) => region.subregion_id === subregionId
      )?.num_relatives;

      if (num_relatives === undefined) {
        return;
      }

      const selector = `button[data-subregion-id="${subregionId
        .replace(/ /g, '_')
        .toLowerCase()}"]::after`;
      const rule = `${selector} { content: '(${num_relatives} relatives)'; }`;
      updateStylesheet(stylesheet, selector, rule);
    });
  });
}

/**
 *
 * @param {HTMLElement} stylesheet
 * @param {String} selector
 * @param {String} rule
 */
function updateStylesheet(stylesheet, selector, rule) {
  tryCatch(() => {
    const { innerHTML } = stylesheet;
    const regex = new RegExp(escapeRegExp(`${selector}.+$`));
    const match = innerHTML.match(regex)?.[0];

    if (match === undefined) {
      stylesheet.innerHTML += `${rule}\n`;
    } else {
      stylesheet.innerHTML = innerHTML.replace(regex, rule);
    }
  });
}

/** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function tryCatch(fn) {
  try {
    return fn();
  } catch (e) {
    console.log("Caught an error!  Here's the function body where it occured:");
    console.log(fn.toString());
    console.log("Here's the native error message:");
    console.log(e);
  }
}
