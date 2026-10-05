const PAGE_SIZE = 20;
const API_URL = "https://pokeapi.co/api/v2/pokemon";

const grid = document.getElementById("grid");
const loading = document.getElementById("loading");
const empty = document.getElementById("empty");
const searchInput = document.getElementById("search");
const prevButton = document.getElementById("prev");
const nextButton = document.getElementById("next");
const pageInfo = document.getElementById("page-info");
const message = document.getElementById("message");

let offset = 0;
let totalPages = 1;
let currentList = [];
let searchTerm = "";
let messageTimer = null;

const loadedPages = {};

function getAbility(pokemon) {
  if (pokemon.abilities.length === 0) {
    return "no known abilities";
  }
  return pokemon.abilities[0].ability.name;
}

function drawCards() {
  const list = currentList.filter(function (pokemon) {
    return pokemon.name.includes(searchTerm);
  });

  if (list.length === 0) {
    grid.innerHTML = "";
    empty.textContent = "No Pokémon found.";
    empty.hidden = false;
    return;
  }

  empty.hidden = true;

  grid.innerHTML = list
    .map(function (pokemon) {
      const image =
        pokemon.sprites.other["official-artwork"].front_default ||
        pokemon.sprites.front_default;

      return (
        '<article class="card">' +
        '<span class="number">#' +
        String(pokemon.id).padStart(3, "0") +
        "</span>" +
        '<img src="' +
        image +
        '" alt="' +
        pokemon.name +
        '">' +
        "<h2>" +
        pokemon.name +
        "</h2>" +
        '<button type="button" data-name="' +
        pokemon.name +
        '" data-ability="' +
        getAbility(pokemon) +
        '">Show ability</button>' +
        "</article>"
      );
    })
    .join("");
}

function loadPage() {
  loading.hidden = false;
  empty.hidden = true;
  grid.innerHTML = "";
  prevButton.disabled = true;
  nextButton.disabled = true;

  const request = loadedPages[offset]
    ? Promise.resolve(loadedPages[offset])
    : fetch(API_URL + "?limit=" + PAGE_SIZE + "&offset=" + offset)
        .then(function (res) {
          return res.json();
        })
        .then(function (data) {
          totalPages = Math.ceil(data.count / PAGE_SIZE);
          return Promise.all(
            data.results.map(function (entry) {
              return fetch(entry.url).then(function (res) {
                return res.json();
              });
            })
          );
        })
        .then(function (details) {
          loadedPages[offset] = details;
          return details;
        });

  request
    .then(function (list) {
      currentList = list;
      drawCards();
      pageInfo.textContent = "Page " + (offset / PAGE_SIZE + 1) + " of " + totalPages;
      prevButton.disabled = offset === 0;
      nextButton.disabled = offset + PAGE_SIZE >= totalPages * PAGE_SIZE;
    })
    .catch(function () {
      empty.textContent = "Could not load data. Please try again later.";
      empty.hidden = false;
    })
    .finally(function () {
      loading.hidden = true;
    });
}

grid.addEventListener("click", function (event) {
  if (event.target.tagName !== "BUTTON") {
    return;
  }

  const name = event.target.getAttribute("data-name");
  const ability = event.target.getAttribute("data-ability");

  message.textContent = "I am " + name + " and I have " + ability + ".";
  message.classList.add("show");

  clearTimeout(messageTimer);
  messageTimer = setTimeout(function () {
    message.classList.remove("show");
  }, 3000);
});

searchInput.addEventListener("input", function () {
  searchTerm = searchInput.value.trim().toLowerCase();
  drawCards();
});

prevButton.addEventListener("click", function () {
  if (offset >= PAGE_SIZE) {
    offset -= PAGE_SIZE;
    loadPage();
  }
});

nextButton.addEventListener("click", function () {
  offset += PAGE_SIZE;
  loadPage();
});

loadPage();
