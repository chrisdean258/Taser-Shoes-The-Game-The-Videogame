let size = 0;
let card_size = 0;
let margin = 15;
let card_margin = 0
let centerX = 0;
let centerY = 0;
let rtnspeed = 25;
let holding = false;
let all_positions = []

class DedupList {
	constructor() {
		this.list = []
	}

	push(item) {
		if(!this.list.includes(item)) {
			this.list.push(item)
		}
	}

	pop(item) {

		let i = this.list.indexOf(item);
		if(i == -1) return
		for(; i < this.list.length - 1; i++)
		{
			this.list[i] = this.list[i + 1];
		}
		this.list.pop()
	}

	indexOf(item) {
		return this.list.indexOf(item);
	}

}

class Card {
	constructor(position, is_mine, label) {
		this.is_mine = is_mine;
		this.held = false;
		this.x = 0;
		this.y = 0;
		this.position = position;
		this.prev_pressed = false
		this.display_preference = 0;
		this.label = label
	}

	draw() {
		rect(this.x, this.y, card_size, card_size, margin)
		text(this.label, this.x, this.y)
	}

	pressed(board) {
		if (this.is_mine && !holding && mouseIsPressed && this.over()) {
			holding = true;
			if(!this.prev_pressed){
				this.offsetX = this.x - mouseX;
				this.offsetY = this.y - mouseY;
			}
			this.prev_pressed = true;
			this.held = true;
		} else if(this.prev_pressed && !mouseIsPressed) {
			this.held = false;
			this.prev_pressed = false;
			holding = false;
		}
	}

	over() {
		const x = this.x + centerX;
		const y = this.y + centerY;
		return Math.abs(mouseX - x) < card_size / 2 && Math.abs(mouseY - y) < card_size / 2
	}

	update(board) {
		this.pressed(board);
		if (this.held) {
			this.x = mouseX + this.offsetX;
			this.y = mouseY + this.offsetY;
			board.update_attractor(this)
			this.display_preference = frameCount;
		} else {
			this.position.attract(this)
		}

	}
}

class Position {
	constructor(x, y) {
		this.cards = new DedupList();
		this.pos = createVector(x, y)
	}

	draw() {
		let c = this.center()
		circle(c.x, c.y, 10)
	}

	center() {
		return p5.Vector.mult(this.pos, card_margin)
	}

	cleanup() {
		for(let card of this.cards.list) {
			if(card.position != this){
				this.cards.pop(card)
			}
		}
	}

	coords(card) {
		return createVector(this.getX(card), this.getY(card))
	}

	attract(card) {
		this.cleanup()
		let coords = this.coords(card)
		let v = p5.Vector.sub(createVector(card.x, card.y), coords)
		if(v.mag() <= rtnspeed){
			card.x = coords.x
			card.y = coords.y
		} else {
			v.setMag(rtnspeed);
			card.x -= v.x;
			card.y -= v.y;
		}

	}

	add(card) {
		this.cards.push(card);
		card.position = this;
	}

	dist(card) {
		return this.center().dist(createVector(card.x, card.y))
	}

	getX(card) {
		return this.pos.x * card_margin
	}

	getY(card) {
		return this.pos.y * card_margin
	}

}

class BoardPosition extends Position {
	getY(card) {
		this.cleanup()
		const i = this.cards.indexOf(card) - (this.cards.list.length - 1) / 2;
		let dy = i * margin;
		return this.pos.y * card_margin + dy
	}
}

class DeckPosition extends Position { }

class HandPosition extends Position {
	constructor(y) {
		super(0, y)
	}

	draw() {
		line(-2 * card_margin, this.pos.y * card_margin, 2 * card_margin, this.pos.y * card_margin)
	}

	getX(card) {
		this.cleanup()
		const i = this.cards.indexOf(card);
		let x = (i - (this.cards.list.length - 1) / 2);
		return x * card_margin
	}

	dist(card) {
		return Math.abs(card.y - this.getY(card))
	}
}


class Board {
	constructor(hand, opp_hand) {
		this.positions = []
		this.hand = hand;
		this.positions.push(new HandPosition(4));
		this.positions.push(new HandPosition(-4));
		for(let i = -2; i <= 2; i++) {
			for(let j = -3; j <= 3; j++) {
				this.positions.push(new BoardPosition(i, j))
			}
		}
		this.positions.push(new BoardPosition(-3, 2))
		this.positions.push(new BoardPosition(-3, 1))
		this.positions.push(new BoardPosition(-3, 0))
		this.positions.push(new BoardPosition(3, -2))
		this.positions.push(new BoardPosition(3, -1))
		this.positions.push(new BoardPosition(3, -0))

		this.positions.push(new DeckPosition(3, 1.4))
		this.positions.push(new DeckPosition(3, 2.6))
	}

	update() { }

	draw() {
		push();
		translate(centerX, centerY);
		rectMode(CENTER);
		for (let p of this.positions) {
			p.draw();
		}
		for (let p of this.positions) {
			p.draw()
		}
		pop()
	}

	update_attractor(card) {
		let min = size * size;
		let min_i = 0;
		for (let i = 0; i < this.positions.length; i++) {
			let d = this.positions[i].dist(card);
			if(d < min){
				min = d;
				min_i = i;
			}
		}
		this.positions[min_i].add(card)
	}


}

class Game {
	constructor() {
		let l = 0;
		this.deck = []
		this.graveyard = []
		this.hand = new DedupList()
		this.opponent_hand = new DedupList()
		this.board = new Board(this.hand, this.opponent_hand)
		for(let i = 0; i < 5; i++) {
			this.deck.push(new Card(this.board.hand_position, true, l++))
			this.board.positions[0].add(this.deck.at(-1))
		}
		for(let i = 0; i < 4; i++) {
			this.deck.push(new Card(this.board.opponent_hand, false, l++))
			this.board.positions[1].add(this.deck.at(-1))
		}

		this.cards = getCards();


		sizes();
	}


	update() {
		this.board.update()
		for(let card of this.deck) {
			card.update(this.board);
		}
		this.deck.sort((a, b) => b.display_preference - a.display_preference);
	}

	draw() {
		this.board.draw()
		push()
		translate(centerX, centerY);
		rectMode(CENTER);
		this.deck.reverse()
		for(let card of this.deck) {
			card.draw();
		}
		this.deck.reverse()
		image(this.cards[0], 0, 0)
		pop()
	}

}

let game = null;
function setup() {
	frameRate(60);
	const canvas_elem = document.getElementById("canvas");
	const canvas = createCanvas(windowWidth, windowHeight, canvas_elem);
	sizes();
	game = new Game();
}


function draw() {
	background("#1c2b42")
	game.update()
	game.draw()
}

function sizes() {
	card_margin = Math.min(windowWidth / 7, windowHeight / 9);
	size = card_margin * 7;
	card_size = card_margin - margin;
	centerX = windowWidth / 2;
	centerY = windowHeight / 2;
}


function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	sizes();
}
