import { getAllEmails, getEmailById } from "./api.js";
import formattedDate from "./dateAndTimeFormater.js";


let isEmailDetailsOpen = false;
const emailListContainer = document.getElementById("email__list");
const emailDetails = document.getElementById("email-details");

const setActiveButton = (activeButtonId) => {
  const filterButtons = document.querySelectorAll(".filter-button");

  filterButtons.forEach((button) => {
    button.classList.remove("active");
  });
  const activeButton = document.getElementById(activeButtonId);
  activeButton.classList.add("active");
};
const saveEmailsToSession = async (page) => {
  const sessionEmails = sessionStorage.getItem("emails");

  if (sessionEmails) {
    console.log("Emails retrieved from sessionStorage");
    return JSON.parse(sessionEmails);
  } else {
    const emailData = await getAllEmails(page);

    const emailDataWithState = emailData.list.map((email) => ({
      ...email,
      read: false, // Default state
      favorite: false, // Default state
    }));
    sessionStorage.setItem("emails", JSON.stringify(emailDataWithState));

    return emailDataWithState;
  }
};
const markAsRead = (emailId) => {
  const emails = JSON.parse(sessionStorage.getItem("emails")) || [];
  const updatedEmails = emails.map((email) =>
    email.id === emailId ? { ...email, read: true } : email
  );
  sessionStorage.setItem("emails", JSON.stringify(updatedEmails));
};
const renderEmails = async (filter = "unread", page = 1) => {
  let existingEmails = JSON.parse(sessionStorage.getItem("emails")) || [];

  if (existingEmails.length === 0) {
    await saveEmailsToSession(page);
    existingEmails = JSON.parse(sessionStorage.getItem("emails")) || [];
  }
  let filteredEmails = existingEmails;

  if (filter === "unread") {
    filteredEmails = existingEmails.filter((email) => !email.read);
  } else if (filter === "read") {
    filteredEmails = existingEmails.filter((email) => email.read);
  } else if (filter === "favorites") {
    filteredEmails = existingEmails.filter((email) => email.favorite);
  }


  try {
 
    emailListContainer.innerHTML = "";
    filteredEmails.reverse().map((email) => {
      const emailCard = document.createElement("article");
      emailCard.className = "card";
      emailCard.id = `${email?.id}`;
      emailCard.innerHTML = `
             <aside class="card__left">${email?.from?.name
               ?.charAt(0)
               .toUpperCase()}</aside>
<div class="card__right">
  <header class="header">
    From:
    <span class="sender" aria-label="Sender: Foo Bar"
      >${email?.from?.name} &lt;${email?.from?.email}&gt;</span
    >
    <br />
    Subject: <span class="subject">  ${email?.subject}</span>
  </header>

  <p class="short_desc">
  ${email?.short_description}
  </p>

  <footer class="card__footer">
   
     <time >
              ${formattedDate(email?.date)}
            </time>
    ${email.favorite ? `<span class="favorite">Favorite</span>` : ""}  </footer>
</div>

            `;
      emailCard.addEventListener("click", () => {
        openDetailEmailCard(email);
      });
      emailListContainer.appendChild(emailCard);
    });
  } catch (error) {
    console.error("Error rendering emails:", error);
  }
};

const openDetailEmailCard = async (emailDetail) => {
  console.log(emailDetail);
  isEmailDetailsOpen = true;

  emailListContainer.classList.add("shrink");
  emailDetails.classList.add("expand");
  markAsRead(emailDetail?.id);
  const emailbody = await getEmailById(emailDetail?.id);
  emailDetails.innerHTML = `
      <header class="email-details__header">
            <aside class="Sender__Initial" aria-label="Sender Initial">${emailDetail?.from?.name
              ?.charAt(0)
              .toUpperCase()}</aside>
          </header>

          <article class="email-details__content">
            <header class="flex">
              <h2 class="heading">${emailDetail?.from?.name}</h2>
               <button class="btn__favorite favorite">
                ${emailDetail?.favorite ? "Remove from Favorite" : "Mark as Favorite"}
              </button>
            </header>
            <section class="email-body">
              <nav class="email-details__footer">
                <time
                
                >
                  ${formattedDate(emailDetail?.date)}
                </time>
              </nav>
              ${emailbody?.body}
                         </section>
          </article>
    `;

    const favoriteButton = emailDetails.querySelector(".btn__favorite");
    favoriteButton.addEventListener("click", () => {
      toggleFavorite(emailDetail.id);
      // Update the button text dynamically after toggling favorite
      favoriteButton.textContent = emailDetail.favorite
        ? "Mark as Favorite"
        : "Remove from Favorite";
      emailDetail.favorite = !emailDetail.favorite; // Update the local state
    });
};

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

const toggleFavorite = (emailId) => {
  const emails = JSON.parse(sessionStorage.getItem("emails")) || [];
  const updatedEmails = emails.map((email) =>
    email.id === emailId ? { ...email, favorite: !email.favorite } : email
  );
  sessionStorage.setItem("emails", JSON.stringify(updatedEmails));
  renderEmails(); // Re-render emails
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

renderEmails();
