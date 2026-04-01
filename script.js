let searchInput = document.getElementById("searchInput");
let searchBtn = document.getElementById("searchBtn");
let bookList = document.getElementById("bookList");
let loadingText = document.getElementById("loadingText");

function getBooks() {
  let searchValue = searchInput.value;

  if (searchValue === "") {
    alert("Please enter a book name!");
    return;
  }

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
        return;
      }

      showBooks(data.items);
    })
    .catch(function (error) {
      loadingText.innerText = "Something went wrong!";
      console.log(error);
    });
}

function showBooks(books) {
  bookList.innerHTML = "";

  books.forEach(function (book) {
    let title = book.volumeInfo.title;
    let author = book.volumeInfo.authors;

    let image = "";
    if (book.volumeInfo.imageLinks) {
      image = book.volumeInfo.imageLinks.thumbnail;
    } else {
      image = "https://via.placeholder.com/100x140?text=No+Image";
    }

    let card = document.createElement("div");
    card.className = "bookCard";

    card.innerHTML = `
      <img src="${image}" />
      <h3>${title}</h3>
      <p>${author ? author[0] : "Unknown Author"}</p>
    `;

    bookList.appendChild(card);
  });
}

searchBtn.addEventListener("click", getBooks);