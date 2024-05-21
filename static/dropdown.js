document.getElementById("user_setting_").addEventListener("click", function (event) {
    const popup = document.getElementById("dropdown");
    
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    popup.style.left = `${mouseX-20}px`;
    popup.style.top = `${mouseY + 35}px`;

    popup.style.display = "block";
});

document.addEventListener("click", function (event) {
  const popup = document.getElementById("dropdown");
  const myElement = document.getElementById("user_setting_");

  if (!popup.contains(event.target) && !myElement.contains(event.target)) {
    popup.style.display = "none";
  }
});
