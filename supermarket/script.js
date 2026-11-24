const categories = [
  {
    name: "Fresh Produce",
    image: "images/produce.jpg",
    copy: "Fruit, greens, and vegetables for the day’s cooking — the first stop for most families who walk in."
  },
  {
    name: "Bakery",
    image: "images/bakery.jpg",
    copy: "Bread, buns, and everyday bakes from the counter, ready for breakfast and evening tea."
  },
  {
    name: "Beverages",
    image: "images/beverages.jpg",
    copy: "Juices, soft drinks, and water lined up for the week, chilled and easy to grab."
  },
  {
    name: "Household",
    image: "images/household.jpg",
    copy: "Cleaners and home essentials for the kitchen, the wash, and the rest of the house."
  },
  {
    name: "Frozen Meat",
    image: "images/meat.jpg",
    copy: "Chilled and frozen meat, packed for the trip home and kept in the cold aisle."
  },
  {
    name: "Ice Creams",
    image: "images/icecream.jpg",
    copy: "Tubs and cones from the freezer — a quick treat on the way to the checkout."
  }
];

const loadingScreen = document.getElementById("loading-screen");
const menuToggle = document.getElementById("mobile-menu");
const navMenu = document.getElementById("nav-menu");
const slideTrack = document.getElementById("slide-track");
const department = document.getElementById("department");
const departmentImage = document.getElementById("department-image");
const departmentTitle = document.getElementById("department-title");
const departmentCopy = document.getElementById("department-copy");
const tagline = document.getElementById("dynamic-tagline");
const form = document.getElementById("enquiry-form");
const formStatus = document.getElementById("form-status");
const openStatus = document.getElementById("open-status");

function hideLoader() {
  loadingScreen.classList.add("is-hidden");
  loadingScreen.setAttribute("aria-hidden", "true");
}

window.addEventListener("load", () => {
  window.setTimeout(hideLoader, 700);
});
window.setTimeout(hideLoader, 2500);

function setMenu(open) {
  menuToggle.classList.toggle("active", open);
  navMenu.classList.toggle("active", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

menuToggle.addEventListener("click", () => {
  setMenu(!navMenu.classList.contains("active"));
});

navMenu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenu(false);
});

function showDepartment(category, button) {
  department.hidden = false;
  departmentImage.src = category.image;
  departmentImage.alt = category.name;
  departmentTitle.textContent = category.name;
  departmentCopy.textContent = category.copy;
  slideTrack.querySelectorAll(".slide").forEach((slide) => {
    slide.classList.toggle("is-active", slide === button);
  });
}

function addSlide(category) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "slide";
  button.innerHTML = `<img alt="" src="${category.image}"><span></span>`;
  button.querySelector("span").textContent = category.name;
  button.addEventListener("click", () => showDepartment(category, button));
  slideTrack.appendChild(button);
}

categories.forEach(addSlide);
categories.forEach(addSlide);

const taglines = [
  "QUALITY, QUANTITY, CREDIBILITY",
  "HOMELY SHOPPING IN PUTHUPPALLY",
  "OPEN EVERY DAY, 8:30 TO 9"
];
let taglineIndex = 0;

function cycleTagline() {
  tagline.style.opacity = "0";
  window.setTimeout(() => {
    taglineIndex = (taglineIndex + 1) % taglines.length;
    tagline.textContent = taglines[taglineIndex];
    tagline.style.opacity = "1";
  }, 700);
}

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  window.setInterval(cycleTagline, 4200);
}

function storeClock() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour").value);
  const minute = Number(parts.find((part) => part.type === "minute").value);
  const now = hour * 60 + minute;
  const open = now >= 8 * 60 + 30 && now < 21 * 60;
  openStatus.textContent = open ? "Open now" : "Closed now";
  openStatus.classList.add(open ? "is-open" : "is-closed");
}

storeClock();

document.getElementById("year").textContent = String(new Date().getFullYear());

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = form.elements.name;
  const email = form.elements.email;
  const message = form.elements.message;
  let valid = true;

  [name, email, message].forEach((field) => {
    const ok = field.value.trim() !== "" && field.checkValidity();
    field.classList.toggle("is-invalid", !ok);
    if (!ok) valid = false;
  });

  if (!valid) {
    formStatus.textContent = "Add your name, a valid email, and a short message.";
    return;
  }

  form.reset();
  [name, email, message].forEach((field) => field.classList.remove("is-invalid"));
  formStatus.textContent = "Thank you. Please call 830 484 4484 so the store can reply today. This page does not send the note by itself.";
});
