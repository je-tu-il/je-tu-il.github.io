"use strict";
const file = document.getElementById("catalog-file");
const search = document.getElementById("catalog-search");
const status = document.getElementById("catalog-status");
const grid = document.getElementById("catalog-games");
let games = [];
let catalogReady = false;
let currentRequest = 0;

function render() {
  const query = search.value.trim().toLocaleLowerCase("fr");
  const visible = games.filter((game) => game.name.toLocaleLowerCase("fr").includes(query));
  const fragment = document.createDocumentFragment();
  for (const game of visible) {
    const card = document.createElement("article");
    card.className = "card";
    const heading = document.createElement("h2");
    heading.textContent = game.name;
    const metadata = document.createElement("p");
    metadata.textContent = [
      Number.isInteger(game.year_published) ? game.year_published : null,
      Array.isArray(game.designer) ? game.designer.filter((name) => typeof name === "string").join(", ") : null,
    ].filter(Boolean).join(" · ");
    card.append(heading);
    if (metadata.textContent) card.append(metadata);
    fragment.append(card);
  }
  grid.replaceChildren(fragment);
  status.textContent = visible.length + (visible.length === 1 ? " jeu affiché." : " jeux affichés.");
}

async function loadCatalog(getData) {
  const request = ++currentRequest;
  const data = await getData();
  if (request !== currentRequest) return;
  if (!Array.isArray(data?.games) || !data.games.every((game) => typeof game?.name === "string")) {
    throw new Error("Le fichier doit contenir une liste de jeux avec un nom pour chacun.");
  }
  games = data.games;
  catalogReady = true;
  search.disabled = false;
  search.value = "";
  render();
}

search.addEventListener("input", render);
file.addEventListener("change", async () => {
  const selected = file.files[0];
  if (!selected) return;
  try {
    await loadCatalog(async () => JSON.parse(await selected.text()));
  } catch {
    status.textContent = "Catalogue JSON illisible." + (catalogReady ? " Le dernier catalogue chargé reste affiché." : "");
  }
});
if (location.protocol === "file:") {
  status.textContent = "Pour afficher l’échantillon en mode local, sélectionnez mega_boardgame_db_sample.json.";
} else {
  loadCatalog(async () => {
    const response = await fetch("./mega_boardgame_db_sample.json");
    if (!response.ok) throw new Error("Échantillon indisponible");
    return response.json();
  }).catch(() => {
    if (currentRequest === 1) status.textContent = "Échantillon indisponible. Vous pouvez choisir un fichier JSON.";
  });
}
