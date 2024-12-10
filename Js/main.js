import { getAllEmails, getEmailById } from "./api.js";
import formattedDate from "./dateAndTimeFormater.js";

let isEmailDetailsOpen = false;
let currentFilter = "unread";
const emailListContainer = document.getElementById("email__list");
const emailDetails = document.getElementById("email-details");
const paginationContainer = document.getElementById("pagination");

const setActiveButton = (activeButtonId) => {
  const filterButtons = document.querySelectorAll(".filter-button");
  filterButtons.forEach((button) => button.classList.remove("active"));
  document.getElementById(activeButtonId).classList.add("active");
};

const saveEmailsToSession = async (page) => {
  const sessionEmails = JSON.parse(sessionStorage.getItem("emails")) || [];
  const visitedPages = JSON.parse(sessionStorage.getItem("visitedPages")) || [];

  if (visitedPages.includes(page)) {
    console.log(`Page ${page} data retrieved from sessionStorage`);
    return sessionEmails;
  }

  const emailData = await getAllEmails(page);
  const emailDataWithState = emailData.list.map((email) => ({
    ...email,
    read: false, 
    favorite: false,
  }));

  const updatedEmails = [...sessionEmails, ...emailDataWithState];
  const updatedPages = [...visitedPages, page];

  sessionStorage.setItem("emails", JSON.stringify(updatedEmails));
  sessionStorage.setItem("visitedPages", JSON.stringify(updatedPages));

  return updatedEmails;
};

const markAsRead = (emailId) => {
  const emails = JSON.parse(sessionStorage.getItem("emails")) || [];
  const updatedEmails = emails.map((email) =>
    email.id === emailId ? { ...email, read: true } : email
  );
  sessionStorage.setItem("emails", JSON.stringify(updatedEmails));
};
const renderEmails = async (filter = "unread", page = 1) => {
  currentFilter = filter;


  emailListContainer.innerHTML = "<p>Loading...</p>";


  await saveEmailsToSession(page);
  const existingEmails = JSON.parse(sessionStorage.getItem("emails")) || [];
  let filteredEmails = existingEmails;

  if (filter === "unread") {
    filteredEmails = existingEmails.filter((email) => !email.read);
  } else if (filter === "read") {
    filteredEmails = existingEmails.filter((email) => email.read);
  } else if (filter === "favorites") {
    filteredEmails = existingEmails.filter((email) => email.favorite);
  }

  const emailsToRender =
    page === 1
      ? filteredEmails.slice(0, 10) 
      : filteredEmails.slice(10, 20); 

 
  if (emailsToRender.length === 0) {
    emailListContainer.innerHTML = "<p>No data available</p>";
    paginationContainer.innerHTML = ""; 
    return;
  }

  emailListContainer.innerHTML = "";
  emailsToRender.forEach((email) => {
    const emailCard = document.createElement("article");
    emailCard.className = "card";
    emailCard.id = `${email.id}`;
    emailCard.innerHTML = `
      <aside class="card__left">${email.from.name
        .charAt(0)
        .toUpperCase()}</aside>
      <div class="card__right">
        <header class="header">
          From: <span class="sender">${email.from.name} &lt;${
      email.from.email
    }&gt;</span>
          <br />
          Subject: <span class="subject">${email.subject}</span>
        </header>
        <p class="short_desc">${email.short_description}</p>
        <footer class="card__footer">
          <time>${formattedDate(email.date)}</time>
          ${email.favorite ? `<span class="favorite">Favorite</span>` : ""}
        </footer>
      </div>
    `;
    emailCard.addEventListener("click", () => openDetailEmailCard(email));
    emailListContainer.appendChild(emailCard);
  });
  updatePaginationUI(page);
};

const updatePaginationUI = (currentPage) => {
  paginationContainer.innerHTML = "";

  const existingEmails = JSON.parse(sessionStorage.getItem("emails")) || [];
  if (existingEmails.length === 0) return;
  const prevButton = document.createElement("button");
  prevButton.textContent = "«";
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener("click", () =>
    renderEmails("unread", currentPage - 1)
  );
  paginationContainer.appendChild(prevButton);
  for (let i = 1; i <= 2; i++) {
    const pageButton = document.createElement("button");
    pageButton.textContent = i;
    pageButton.dataset.page = i;
    if (i === currentPage) pageButton.classList.add("active");
    pageButton.addEventListener("click", () => renderEmails("unread", i));
    paginationContainer.appendChild(pageButton);
  }
  const nextButton = document.createElement("button");
  nextButton.textContent = "»";
  nextButton.disabled = currentPage === 2;
  nextButton.addEventListener("click", () =>
    renderEmails("unread", currentPage + 1)
  );
  paginationContainer.appendChild(nextButton);
};

const openDetailEmailCard = async (emailDetail) => {
  isEmailDetailsOpen = true;
  emailListContainer.classList.add("shrink");
  emailDetails.classList.add("expand");
  markAsRead(emailDetail.id);

  const emailBody = await getEmailById(emailDetail.id);
  emailDetails.innerHTML = `
    <header class="email-details__header">
      <aside class="Sender__Initial">${emailDetail.from.name
        .charAt(0)
        .toUpperCase()}</aside>
    </header>
    <article class="email-details__content">
      <header class="flex">
        <h2 class="heading">${emailDetail.from.name}</h2>
        <button class="btn__favorite favorite">
          ${emailDetail.favorite ? "Remove from Favorite" : "Mark as Favorite"}
        </button>
      </header>
      <section class="email-body">${emailBody.body}</section>
      <nav class="email-details__footer">
        <time>${formattedDate(emailDetail.date)}</time>
      </nav>
    </article>
  `;

  const favoriteButton = emailDetails.querySelector(".btn__favorite");
  favoriteButton.addEventListener("click", () => {
    toggleFavorite(emailDetail.id);
    favoriteButton.textContent = emailDetail.favorite
      ? "Mark as Favorite"
      : "Remove from Favorite";
    emailDetail.favorite = !emailDetail.favorite;
  });
};
const toggleFavorite = (emailId) => {
  const emails = JSON.parse(sessionStorage.getItem("emails")) || [];
  const updatedEmails = emails.map((email) =>
    email.id === emailId ? { ...email, favorite: !email.favorite } : email
  );
  sessionStorage.setItem("emails", JSON.stringify(updatedEmails));
  renderEmails(currentFilter);
};

document.getElementById("filter-unread").addEventListener("click", () => {
  setActiveButton("filter-unread");
  renderEmails("unread");
});
document.getElementById("filter-read").addEventListener("click", () => {
  setActiveButton("filter-read");
  renderEmails("read");
});
document.getElementById("filter-favorites").addEventListener("click", () => {
  setActiveButton("filter-favorites");
  renderEmails("favorites");
});

paginationContainer.addEventListener("click", (event) => {
  const page = event.target.dataset.page;
  if (page) renderEmails("unread", Number(page));
});

const handleOutsideClick = (event) => {
  const emailDetails = document.getElementById("email-details");
  const emailList = document.getElementById("email__list");
  if (
    isEmailDetailsOpen &&
    !emailDetails.contains(event.target) &&
    !event.target.closest(".card")
  ) {
    emailDetails.classList.remove("expand");
    emailList.classList.remove("shrink");
    isEmailDetailsOpen = false;
  }
};
document.addEventListener("click", handleOutsideClick);
renderEmails();
