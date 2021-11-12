'use strict';

// grep the profile JSON from a script tag
const obj = JSON.parse(
  document
    .querySelector('script[src^="/static/js/lib/turf.min."]')
    .nextElementSibling.innerHTML.match(
      /(?<=exports.reports.ancestryCompositionHD.ACOneWorldMapCoordinator\().+(?=\}\))/s
    )[0]
    .replace(/\\n/gs, '')
    .replace(/\s+/gs, ' ')
    .replace(/(?<=\/\*).*(?=\*\/)/gs, '')
    .replace(/\/\*\*\//gs, '')
    .replace(/(?<= )[A-Za-z\-_\d]+(?=:)/g, (s) => `"${s}"`)
    .replace(/,\s+(?=\})/gs, '')
    .replace(/'[A-Za-z\-_\d]+'(?!:)/gs, (s) => s.replace(/'/gs, '"'))
    .slice(0, -3)
    .replace(/(?<="(\{|\)))"v\d"(?=(\}|\))")/gs, (s) => s.replace(/"/g, "'"))
);

const regions = extractRegions(obj);

// we'll be displaying relative counts by updating 
// the region ::after pseudo elements in this style
// tag
const stylesheet = document.createElement('style');
document.body.append(stylesheet);

updateUI1();

// update subregions that are visible by default
// and not hidden behind a +16 regions button
function updateUI1() {
  document
    .querySelectorAll('.country-name.js-country-name-group.js-country-group.b3')
    .forEach((el) => {
      const textContent = el.querySelector('strong')?.textContent;
      if (!textContent) {
        return;
      }

      el.id = textContent.replace(/ /g, '-');

      const { num_relatives } = regions.find(
        (region) => region.state === textContent
      );

      stylesheet.innerHTML += `#${el.id}::after { content: '(${num_relatives} relatives)'; }`;
    });
}

// when clicking to expand and show more regions,
// the newly-created region elements need to be
// updated too.
document.addEventListener('click', ({ target }) => {
  if (target.matches('.accordion-trigger *')) {
    updateUI2();
  }
});

// update revealed hidden subregions
function updateUI2() {
  document.querySelectorAll('button[data-subregion-id]').forEach((el) => {
    const { subregionId } = el.dataset;
    const { num_relatives } = regions.find(
      (region) => region.subregion_id === subregionId
    );
    stylesheet.innerHTML += `button[data-subregion-id="${subregionId}"]::after {
    content: '(${num_relatives} relatives)';
  }`;
  });
}

/**
 * There's a LOT of stuff in the profile JSON.
 * We'll be extracting the region data and
 * ignoring everything else.
 * @returns {{ 
 *  num_gp: number,
 *  subregion_id: string, 
 *  num_relatives: number, 
 *  state: string 
 * }[]} Regions
 */
function extractRegions(obj) {
  return obj.populationTree.children
    .map((child) => {
      return child.children.map((child) => {
        return child.children.map((child) => {
          return child.countries.map((country) => {
            return country.aggregations;
          });
        });
      });
    })
    .flat(Infinity);
}
