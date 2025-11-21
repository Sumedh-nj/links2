
// ====== Games Modal Logic ======
document.addEventListener("DOMContentLoaded", function() {
	const openBtn = document.getElementById("open-games-modal");
	const modal = document.getElementById("games-modal");
	const closeBtn = document.getElementById("close-games-modal");
	const gameBtns = document.querySelectorAll(".game-choice-btn");

	if (openBtn && modal) {
		openBtn.addEventListener("click", () => {
			modal.style.display = "block";
		});
	}
	if (closeBtn && modal) {
		closeBtn.addEventListener("click", () => {
			modal.style.display = "none";
		});
	}
	window.addEventListener("click", function(event) {
		if (event.target === modal) {
			modal.style.display = "none";
		}
	});

	gameBtns.forEach(btn => {
		btn.addEventListener("click", function() {
			const game = btn.getAttribute("data-game");
			if (game) {
				window.open(game + ".html", "_blank");
				modal.style.display = "none";
			}
		});
	});
});
