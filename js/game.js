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
	constructor(position, is_mine) {
		this.is_mine = is_mine;
		this.held = false;
		this.x = 0;
		this.y = position.hint();
		this.position = position;
		this.prev_pressed = false
	}

	draw() {

		rect(this.x, this.y, card_size, card_size, margin)
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
			board.drop_card(this)
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
		} else {
			this.position.attract(this)
		}

	}
}

class BoardPosition {
	constructor(x, y) {
		this.x = x
		this.y = y
	}

	attract(card) {
		let v = createVector(card.x - this.x, card.y - this.y);
		if(v.mag() < rtnspeed){
			card.x = this.x
			card.y = this.y
			return true;
		}
		v.setMag(rtnspeed);
		card.x -= v.x;
		card.y -= v.y;
		return false;
	}

	dist(card) {
		let v = createVector(card.x - this.x, card.y - this.y);
		return v.mag()

	}

	hint() {
		return 0
	}

	draw() {
		circle(this.x, this.y, 10)
	}
}

class HandPosition {
	constructor(hand, y) {
		this.y = y
		this.hand = hand
	}

	attract(card) {
		const i = this.hand.indexOf(card);
		if(i == -1){
			console.log("weird")
			return
		}
		const x = (card_margin * (i - (this.hand.list.length - 1) / 2));
		let v = createVector(card.x - x, card.y - this.y);
		if(v.mag() < rtnspeed){
			card.x = x
			card.y = this.y
			return true;
		}
		v.setMag(rtnspeed);
		card.x -= v.x;
		card.y -= v.y;
		return false;

	}

	hint() {
		return this.y
	}


	dist(card) {
		return Math.abs(card.y - this.y)
	}

}


class Board {
	constructor(hand, opp_hand) {
		this.positions = []
		this.cards = new DedupList()
		this.hand = hand;
		this.hand_position = new HandPosition(hand, 3 * card_margin);
		this.opponent_hand = new HandPosition(opp_hand, - 3 * card_margin);
		for(let i = -2; i <= 2; i++) {
			for(let j = -2; j <= 2; j++) {
				this.positions.push(new BoardPosition(i * card_margin, j * card_margin))
			}
		}
		this.positions.push(new BoardPosition(-3 * card_margin, 2 * card_margin))
		this.positions.push(new BoardPosition(-3 * card_margin, 1 * card_margin))
		this.positions.push(new BoardPosition(-3 * card_margin, 0 * card_margin))

		this.positions.push(new BoardPosition(3 * card_margin, -2 * card_margin))
		this.positions.push(new BoardPosition(3 * card_margin, -1 * card_margin))
		this.positions.push(new BoardPosition(3 * card_margin, -0 * card_margin))
	}

	update() {
		for (let c of this.cards.list) {
			c.update(this);
		}
	}

	draw() {
		push();
		translate(centerX, centerY);
		rectMode(CENTER);
		for (let p of this.positions) {
			p.draw();
		}
		rect(0, 0, 5 * card_margin, 5 * card_margin);
		for(let i = -2; i <= 2; i++) {
			for(let j = -2; j <= 2; j++) {
				rect(i * card_margin, j * card_margin, card_margin);
			}
		}
		rect(-3 * card_margin, -1.4 * card_margin, card_margin, card_margin, margin);
		rect(-3 * card_margin, -2.6 * card_margin, card_margin, card_margin, margin);
		rect(3 * card_margin, 1.4 * card_margin, card_margin, card_margin, margin);
		rect(3 * card_margin, 2.6 * card_margin, card_margin, card_margin, margin);
		for (let c of this.cards.list) {
			c.draw();
		}
		pop()
	}

	drop_card(card) {
		let min = size * size;
		let min_i = 0;
		for (let i = 0; i < this.positions.length; i++) {
			let d = this.positions[i].dist(card);
			if(d < min){
				min = d;
				min_i = i;
			}
		}
		if(this.hand_position.dist(card) < min) {
			card.position = this.hand_position
			this.hand.push(card);
			return
		}
		card.position = this.positions[min_i];
		this.hand.pop(card)
		this.cards.push(card)

	}


}

class Game {
	constructor() {
		this.deck = []
		this.graveyard = []
		this.hand = new DedupList()
		this.opponent_hand = new DedupList()
		this.board = new Board(this.hand, this.opponent_hand)
		for(let i = 0; i < 5; i++) this.hand.push(new Card(this.board.hand_position, true))
		for(let i = 0; i < 4; i++) this.opponent_hand.push(new Card(this.board.opponent_hand, false))

		sizes();
	}

	draw_hands() {
		push();
		translate(centerX, centerY);
		rectMode(CENTER);
		for(let card of this.hand.list) {
			card.draw();
		}

		for(let card of this.opponent_hand.list) {
			card.draw()
		}
		pop()
	}

	update() {
		this.board.update()
		for(let card of this.hand.list) {
			card.update(this.board);
		}

		for(let card of this.opponent_hand.list) {
			card.update(this.board);
		}
	}

	draw() {
		this.board.draw()
		push()
		translate(centerX, centerY);
		rectMode(CENTER);
		rect(-3 * card_margin, 0, card_margin)
		rect(-3 * card_margin, card_margin, card_margin)
		rect(-3 * card_margin, card_margin * 2, card_margin)
		rect(3 * card_margin, 0, card_margin)
		rect(3 * card_margin, - card_margin, card_margin)
		rect(3 * card_margin, - card_margin * 2, card_margin)
		pop()
		this.draw_hands();
	}

}

// game.draw()



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
	size = Math.min(windowWidth, windowHeight);
	card_margin = size / 7
	card_size = card_margin - margin;
	centerX = windowWidth / 2;
	centerY = windowHeight / 2;
}


function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	sizes();
}



