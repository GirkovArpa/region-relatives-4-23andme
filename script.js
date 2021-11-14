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

console.log('Here is your profile JSON data:');
console.log(obj);

const regions = extractRegions(obj);

console.log('Here are your regions:');
console.log(regions);

// we'll be displaying relative counts by updating
// the region ::after pseudo elements in this style
// tag
const stylesheet = document.createElement('style');
document.body.append(stylesheet);

try {
  updateUI1();
} catch (e) {
  console.log('Caught an error in updateUI1():');
  console.log(e);
}

// update subregions that are visible by default
// and not hidden behind a +16 regions button
function updateUI1() {
  document
    .querySelectorAll('.country-name.js-country-name-group.js-country-group.b3')
    .forEach((el) => {
      try {
        const textContent = el.querySelector('strong')?.textContent;
        if (!textContent) {
          return;
        }

        el.id = textContent.replace(/ /g, '-');

        const { num_relatives } = regions.find(
          (region) => region.state === textContent
        );

        stylesheet.innerHTML += `#${el.id}::after { content: '(${num_relatives} relatives)'; }`;
      } catch (e) {
        console.log('Caught an error in a .forEach in updateUI1():');
        console.log(e);
      }
    });
}

// when clicking to expand and show more regions,
// the newly-created region elements need to be
// updated too.
document.addEventListener('click', ({ target }) => {
  if (target.matches('.accordion-trigger *')) {
    try {
      updateUI2();
    } catch (e) {
      console.log('Caught an error in document.addEventListener("click", ...):');
      console.log(e);
    }
  }
});

// update revealed hidden subregions
function updateUI2() {
  document.querySelectorAll('button[data-subregion-id]').forEach((el) => {
    try {
      const { subregionId } = el.dataset;
      const { num_relatives } = regions.find(
        (region) => region.subregion_id === subregionId
      );
      stylesheet.innerHTML += `button[data-subregion-id="${subregionId}"]::after { content: '(${num_relatives} relatives)'; }`;
    } catch (e) {
      console.log('Caught an error in a .forEach in updateUI2():');
      console.log(e);
    }
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
  try {
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
  } catch (e) {
    console.log('Caught an error in extractRegions(obj):');
    console.log(e);
  }
}
