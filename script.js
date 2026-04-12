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

  showingFavorites = false;
  loadingText.innerText = "Loading books...";
  bookList.innerHTML = "";

  fetch("https://www.googleapis.com/books/v1/volumes?q=" + searchValue)
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      loadingText.innerText = "";

      if (!data.items) {
        bookList.innerHTML = "<h2>No books found</h2>";
        allBooks = [];
        return;
      }

      allBooks = data.items;
      filterSortAndShow();
    })
    .catch(function () {
      loadingText.innerText = "";
      bookList.innerHTML = "<h2>Something went wrong!</h2>";
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