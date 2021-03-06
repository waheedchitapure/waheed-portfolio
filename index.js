// Sticky Navigation Menu Js

let nav = document.querySelector("nav");
let scrollBtn = document.querySelector(".scroll-button a");

let val;

window.onscroll = function() {
    if (document.documentElement.scrollTop > 20) {
        nav.classList.add("sticky");
        scrollBtn.style.display = "block";
    } else {
        nav.classList.remove("sticky");
        scrollBtn.style.display = "none";
    }
}

// Side Navigation Menu Js
let body = document.querySelector("body");
let navBar = document.querySelector(".navbar");
let menuBtn = document.querySelector(".menu-btn");
let cancelBtn = document.querySelector(".cancel-btn");

menuBtn.onclick = function() {
    navBar.classList.add("active");
    menuBtn.style.opacity = "0";
    menuBtn.style.pointerEvents = "none";
    body.style.overflowX = "hidden";
    scrollBtn.style.pointerEvents = "none";
}

cancelBtn.onclick = function() {
    navBar.classList.remove("active");
    menuBtn.style.opacity = "1";
    menuBtn.style.pointerEvents = "auto";
    body.style.overflowX = "auto";
    scrollBtn.style.pointerEvents = "auto";
}

// Side Navigation Bar Close While We click On Navigation Links

let navLinks = document.querySelectorAll(".menu li a");
for (var i = 0; i < navLinks.length; i++) {
    navLinks[i].addEventListener("click", function() {
        navBar.classList.remove("active");
        menuBtn.style.opacity = "1";
        menuBtn.style.pointerEvents = "auto";
    });
}


gsap.from(".navbar", { opacity: 0, duration: 1, delay: 0.5, y: -200 });
gsap.from(".home", { opacity: 0, duration: 1, delay: 1.5, y: -200 });
gsap.from(".left", { opacity: 0, duration: 1, delay: 1.5, x: -200 });
gsap.from(".right", { opacity: 0, duration: 1, delay: 1.5, x: 20 });




new TypeIt("#type1", {
        speed: 120,
        loop: true,
        waitUntilVisible: true,
    })
    .type("Front end developer", { delay: 400 })
    .pause(500)
    .delete(19)
    .type("Web Designer", { delay: 400 })
    .pause(500)
    .delete(12)
    .type("UI Developer", { delay: 400 })
    .pause(500)
    .delete(12)
    .go();



$('.moreless-button').click(function() {
    $('.moretext').slideToggle();
    if ($('.moreless-button').text() == "Read more") {
        $(this).text("Read less")
    } else {
        $(this).text("Read more")
    }
});