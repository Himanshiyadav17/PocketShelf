let searchInput = document.getElementById("searchInput");
let searchBtn = document.getElementById("searchBtn");
let bookList = document.getElementById("bookList");
let loadingText = document.getElementById("loadingText");

let filterInput = document.getElementById("filterInput");
let sortSelect = document.getElementById("sortSelect");
let authorFilter = document.getElementById("authorFilter");

let themeBtn = document.getElementById("themeBtn");
let favBtn = document.getElementById("favBtn");

let allBooks = [];
let showingFavorites = false;
let isFetching = false;


function setTheme() {
  let theme = localStorage.getItem("theme");

  if (theme === "dark") {
    document.body.classList.add("dark");
    themeBtn.innerText = "☀️ Light Mode";
  } else {
    document.body.classList.remove("dark");
    themeBtn.innerText = "🌙 Dark Mode";
  }
}

themeBtn.addEventListener("click", function () {
  if (document.body.classList.contains("dark")) {
    localStorage.setItem("theme", "light");
  } else {
    localStorage.setItem("theme", "dark");
  }
  setTheme();
});

setTheme();



function getFavBooks() {
  let favData = localStorage.getItem("favorites");
  return favData ? JSON.parse(favData) : [];
}

function mapOpenLibraryToVolume(item) {
  return {
    id: item.key || item.cover_edition_key || (item.edition_key && item.edition_key[0]) || item.title,
    volumeInfo: {
      title: item.title || "No Title",
      authors: item.author_name,
      previewLink: item.key ? "https://openlibrary.org" + item.key : "",
      imageLinks: item.cover_i
        ? { thumbnail: "https://covers.openlibrary.org/b/id/" + item.cover_i + "-M.jpg" }
        : undefined,
    },
  };
}

function fetchOpenLibraryBooks(searchValue) {
  let url = "https://openlibrary.org/search.json?q=" + encodeURIComponent(searchValue) + "&limit=20";

  return fetch(url)
    .then(function (res) {
      if (!res.ok) {
        throw res;
      }
      return res.json();
    })
    .then(function (data) {
      if (!data.docs || !data.docs.length) {
        return [];
      }
      return data.docs.map(mapOpenLibraryToVolume);
    });
}

function saveFavBooks(favs) {
  localStorage.setItem("favorites", JSON.stringify(favs));
}

function toggleFav(book) {
  let favs = getFavBooks();

  let found = favs.find(function (b) {
    return b.id === book.id;
  });

  if (found) {
    favs = favs.filter(function (b) {
      return b.id !== book.id;
    });
  } else {
    favs.push(book);
  }

  saveFavBooks(favs);

  if (showingFavorites) {
    showBooks(getFavBooks());
  } else {
    filterSortAndShow();
  }
}


function fetchBooks() {
  let searchValue = searchInput.value.trim();

  if (searchValue === "") {
    alert("Please enter a book name!");
    return;
  }

  if (isFetching) {
    return;
  }

  showingFavorites = false;
  loadingText.innerText = "Loading books...";
  bookList.innerHTML = "";
  searchBtn.disabled = true;
  isFetching = true;

  let googleUrl = "https://www.googleapis.com/books/v1/volumes?q=" + encodeURIComponent(searchValue) + "&maxResults=20";

  fetch(googleUrl)
    .then(function (res) {
      if (res.status === 429) {
        throw { rateLimit: true };
      }
      if (!res.ok) {
        throw res;
      }
      return res.json();
    })
    .then(function (data) {
      if (data.items && data.items.length) {
        loadingText.innerText = "";
        isFetching = false;
        searchBtn.disabled = false;
        allBooks = data.items;
        filterSortAndShow();
        return;
      }

      return fetchOpenLibraryBooks(searchValue).then(function (fallbackBooks) {
        loadingText.innerText = "";
        isFetching = false;
        searchBtn.disabled = false;

        if (!fallbackBooks.length) {
          bookList.innerHTML = "<h2>No books found</h2>";
          allBooks = [];
          return;
        }

        bookList.innerHTML = "<h2>Google Books limit reached. Showing Open Library results.</h2>";
        allBooks = fallbackBooks;
        filterSortAndShow();
      });
    })
    .catch(function (error) {
      if (error && error.rateLimit) {
        fetchOpenLibraryBooks(searchValue)
          .then(function (fallbackBooks) {
            loadingText.innerText = "";
            isFetching = false;
            searchBtn.disabled = false;

            if (!fallbackBooks.length) {
              bookList.innerHTML = "<h2>Rate limit exceeded. Please wait a moment and try again.</h2>";
              allBooks = [];
              return;
            }

            bookList.innerHTML = "<h2>Google Books limit reached. Showing Open Library results.</h2>";
            allBooks = fallbackBooks;
            filterSortAndShow();
          })
          .catch(function () {
            loadingText.innerText = "";
            isFetching = false;
            searchBtn.disabled = false;
            bookList.innerHTML = "<h2>Rate limit exceeded. Please wait a moment and try again.</h2>";
          });
      } else {
        loadingText.innerText = "";
        isFetching = false;
        searchBtn.disabled = false;

        fetchOpenLibraryBooks(searchValue)
          .then(function (fallbackBooks) {
            if (fallbackBooks.length) {
              bookList.innerHTML = "<h2>Google Books failed. Showing Open Library results.</h2>";
              allBooks = fallbackBooks;
              filterSortAndShow();
              return;
            }
            bookList.innerHTML = "<h2>Something went wrong!</h2>";
          })
          .catch(function () {
            bookList.innerHTML = "<h2>Something went wrong!</h2>";
          });
      }
    });
}


function filterSortAndShow() {
  let books = [...allBooks];

  // Filter by title text
  let text = filterInput.value.toLowerCase().trim();
  if (text !== "") {
    books = books.filter(function (book) {
      let title = book.volumeInfo.title ? book.volumeInfo.title.toLowerCase() : "";
      return title.includes(text);
    });
  }

  
  let authorValue = authorFilter.value;

  if (authorValue === "author") {
    books = books.filter(function (book) {
      return book.volumeInfo.authors !== undefined;
    });
  }

  if (authorValue === "noauthor") {
    books = books.filter(function (book) {
      return book.volumeInfo.authors === undefined;
    });
  }

  
  let sortValue = sortSelect.value;

  if (sortValue === "az") {
    books.sort(function (a, b) {
      let titleA = a.volumeInfo.title ? a.volumeInfo.title.toLowerCase() : "";
      let titleB = b.volumeInfo.title ? b.volumeInfo.title.toLowerCase() : "";
      return titleA.localeCompare(titleB);
    });
  }

  if (sortValue === "za") {
    books.sort(function (a, b) {
      let titleA = a.volumeInfo.title ? a.volumeInfo.title.toLowerCase() : "";
      let titleB = b.volumeInfo.title ? b.volumeInfo.title.toLowerCase() : "";
      return titleB.localeCompare(titleA);
    });
  }

  showBooks(books);
}



function showBooks(books) {
  bookList.innerHTML = "";

  if (books.length === 0) {
    bookList.innerHTML = "<h2>No results found</h2>";
    return;
  }

  let favs = getFavBooks();

  books.forEach(function (book) {
    let title = book.volumeInfo.title || "No Title";
    let author = book.volumeInfo.authors ? book.volumeInfo.authors[0] : "Unknown Author";
    let link = book.volumeInfo.previewLink;

    let image = book.volumeInfo.imageLinks
      ? book.volumeInfo.imageLinks.thumbnail
      : "https://via.placeholder.com/100x140?text=No+Image";

    let isFav = favs.find(function (b) {
      return b.id === book.id;
    });

    let card = document.createElement("div");
    card.className = "bookCard";

    card.innerHTML = `
      <img src="${image}" alt="${title}">
      <h3>${title}</h3>
      <p>${author}</p>

      <div class="cardButtons">
        <button class="viewBtn">📖 View</button>
        <button class="favHeart">${isFav ? "💖" : "🤍"}</button>
      </div>
    `;

    card.querySelector(".viewBtn").addEventListener("click", function () {
      window.open(link, "_blank");
    });

    card.querySelector(".favHeart").addEventListener("click", function () {
      toggleFav(book);
    });

    bookList.appendChild(card);
  });
}


searchBtn.addEventListener("click", fetchBooks);

searchInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    fetchBooks();
  }
});

filterInput.addEventListener("input", function () {
  if (!showingFavorites) {
    filterSortAndShow();
  }
});

sortSelect.addEventListener("change", function () {
  if (!showingFavorites) {
    filterSortAndShow();
  }
});

authorFilter.addEventListener("change", function () {
  if (!showingFavorites) {
    filterSortAndShow();
  }
});


favBtn.addEventListener("click", function () {
  showingFavorites = true;

  let favBooks = getFavBooks();

  if (favBooks.length === 0) {
    bookList.innerHTML = "<h2>No favorites saved ❤️</h2>";
  } else {
    showBooks(favBooks);
  }
});