var updates = [];

function getCards() {
	let cards = []
	for(let i = 0; i < 91; i++) {
		cards.push({
			   full: loadImage(`/cards/full/${i}.png`),
			   small: loadImage(`/cards/small/${i}.png`)
		})
	}

	return cards
}

function getBack() {
	return loadImage(`/cards/full/back.png`);
}

function map_position(num) {
	if (num == 0 || num == 1) return 1 - num;
	if (num <= 36) return 38 - num;
	if (num <= 39) return 79 - num;
	if (num <= 44) return num + 2;
	if (num <= 46) return num - 2;
	if (num <= 48) return 95 - num;
}

