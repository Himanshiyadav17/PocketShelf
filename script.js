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


function applyTheme() {
  let savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
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

  applyTheme();
});

applyTheme();


function getFavorites() {
  let favData = localStorage.getItem("favorites");
  return favData ? JSON.parse(favData) : [];
}

function saveFavorites(favs) {
  localStorage.setItem("favorites", JSON.stringify(favs));
}

function toggleFavorite(bookObj) {
  let favs = getFavorites();

  let alreadyExists = favs.find(function (b) {
    return b.id === bookObj.id;
  });

  if (alreadyExists) {
    favs = favs.filter(function (b) {
      return b.id !== bookObj.id;
    });
  } else {
    favs.push(bookObj);
  }

  saveFavorites(favs);

  if (showingFavorites) {
    showBooks(getFavorites());
  } else {
    applyFiltersAndSort();
  }
}



function getBooks() {
  let searchValue = searchInput.value;

  if (searchValue === "") {
    alert("Please enter a book name!");
    return;
  }

  showingFavorites = false;

  loadingText.innerText = "Loading books...";
  bookList.innerHTML = "";

  fetch("https://www.googleapis.com/books/v1/volumes?q=" + searchValue)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      loadingText.innerText = "";

      if (data.items == undefined) {
        bookList.innerHTML = "<h2>No books found</h2>";
        allBooks = [];
        return;
      }

      allBooks = data.items;
      applyFiltersAndSort();
    })
    .catch(function (error) {
      loadingText.innerText = "Something went wrong!";
      console.log(error);
    });
}



function applyFiltersAndSort() {
  let filteredBooks = allBooks;

  
  let text = filterInput.value.toLowerCase();
  if (text !== "") {
    filteredBooks = filteredBooks.filter(function (book) {
      let title = book.volumeInfo.title ? book.volumeInfo.title.toLowerCase() : "";
      return title.includes(text);
    });
  }

  
  
  let authorValue = authorFilter.value;

  if (authorValue === "author") {
    filteredBooks = filteredBooks.filter(function (book) {
      return book.volumeInfo.authors !== undefined;
    });
  } else if (authorValue === "noauthor") {
    filteredBooks = filteredBooks.filter(function (book) {
      return book.volumeInfo.authors === undefined;
    });
  }

  
  let sortValue = sortSelect.value;

  if (sortValue === "az") {
    filteredBooks = filteredBooks.sort(function (a, b) {
      let titleA = a.volumeInfo.title ? a.volumeInfo.title.toLowerCase() : "";
      let titleB = b.volumeInfo.title ? b.volumeInfo.title.toLowerCase() : "";
      return titleA.localeCompare(titleB);
    });
  }

  if (sortValue === "za") {
    filteredBooks = filteredBooks.sort(function (a, b) {
      let titleA = a.volumeInfo.title ? a.volumeInfo.title.toLowerCase() : "";
      let titleB = b.volumeInfo.title ? b.volumeInfo.title.toLowerCase() : "";
      return titleB.localeCompare(titleA);
    });
  }

  showBooks(filteredBooks);
}


function showBooks(books) {
  bookList.innerHTML = "";

  if (books.length === 0) {
    bookList.innerHTML = "<h2>No results found</h2>";
    return;
  }

  let favs = getFavorites();

  books.forEach(function (book) {
    let title = book.volumeInfo.title;
    let author = book.volumeInfo.authors;
    let link = book.volumeInfo.previewLink;

    let image = "";
    if (book.volumeInfo.imageLinks) {
      image = book.volumeInfo.imageLinks.thumbnail;
    } else {
      image = "https://via.placeholder.com/100x140?text=No+Image";
    }

    let isFav = favs.find(function (b) {
      return b.id === book.id;
    });

    let card = document.createElement("div");
    card.className = "bookCard";

    card.innerHTML = `
      <img src="${image}" />
      <h3>${title}</h3>
      <p>${author ? author[0] : "Unknown Author"}</p>

      <div class="cardButtons">
        <button class="viewBtn">📖 View</button>
        <button class="favHeart">${isFav ? "💖" : "🤍"}</button>
      </div>
    `;

    let viewBtn = card.querySelector(".viewBtn");
    viewBtn.addEventListener("click", function () {
      window.open(link, "_blank");
    });

    let favHeart = card.querySelector(".favHeart");
    favHeart.addEventListener("click", function () {
      toggleFavorite(book);
    });

    bookList.appendChild(card);
  });
}



searchBtn.addEventListener("click", getBooks);

filterInput.addEventListener("input", function () {
  if (!showingFavorites) {
    applyFiltersAndSort();
  }
});

sortSelect.addEventListener("change", function () {
  if (!showingFavorites) {
    applyFiltersAndSort();
  }
});

authorFilter.addEventListener("change", function () {
  if (!showingFavorites) {
    applyFiltersAndSort();
  }
});



favBtn.addEventListener("click", function () {
  showingFavorites = true;

  let favBooks = getFavorites();

  if (favBooks.length === 0) {
    bookList.innerHTML = "<h2>No favorites saved ❤️</h2>";
  } else {
    showBooks(favBooks);
  }
});


searchInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    getBooks();
  }
});