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
