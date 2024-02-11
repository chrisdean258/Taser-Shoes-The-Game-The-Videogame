let size = 0;
let card_size = 0;
let margin = 15;
let card_margin = 0
let centerX = 0;
let centerY = 0;
let rtnspeed = 25;
let holding = false;
let all_positions = []
let back = null;

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
	constructor(number, is_mine, image) {
		this.number = number
		this.is_mine = is_mine;
		this.held = false;
		this.x = 0;
		this.y = 0;
		this.position = null
		this.prev_pressed = false
		this.display_preference = - Math.random();
		this.image = image
		this.show_big = false;
		this.face_up = false;
		this.grabbable = true;
	}

	draw() {
		push()
		rect(this.x, this.y, card_size, card_size, margin)
		let img;
		if (this.face_up) {
			img = this.image.small;
		} else {
			img = back
		}
		image(img, this.x, this.y, card_size, card_size, 0, 0, img.width, img.height, CONTAIN);
		noFill()
		strokeWeight(4)
		if (!this.is_mine) stroke('red');
		rect(this.x, this.y, card_size, card_size, margin)
		if((this.is_mine || this.face_up) && this.show_big) {
			let img2 = this.image.full;
			image(img2, 0, 0, card_margin * 3, card_margin * 3)

		}
		pop()
	}

	pressed(board) {
		let over = this.over();
		if (this.grabbable && this.is_mine && !holding && mouseIsPressed && mouseButton === LEFT && over) {
			this.position.clickAction(this)
		} else if(this.prev_pressed && !mouseIsPressed) {
			this.held = false;
			this.prev_pressed = false;
			holding = false;
			this.position.dropAction(this)
		}
		if(!mouseIsPressed && over) {
			this.position.noClickAction(this)
		}
	}

	grab() {
		holding = true;
		if(!this.prev_pressed){
			this.offsetX = this.x - mouseX;
			this.offsetY = this.y - mouseY;
		}
		this.prev_pressed = true;
		this.held = true;
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
			board.update_postion(this)
			this.display_preference = frameCount;
		} else {
			this.position.attract(this)
		}
		this.show_big = this.over() && mouseIsPressed && mouseButton == RIGHT
		if(this.show_big) this.display_preference = frameCount;
	}
}

class Position {
	constructor(x, y, attractive) {
		this.cards = new DedupList();
		this.pos = createVector(x, y)
		this.attractive = attractive
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
			card.grabbable = true;
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

	dropAction(card) { }

	clickAction(card) {
		card.grab()
	}

	noClickAction() { }

}

class BoardPosition extends Position {
	getY(card) {
		this.cleanup()
		const i = this.cards.indexOf(card) - (this.cards.list.length - 1) / 2;
		let dy = i * margin;
		return this.pos.y * card_margin + dy
	}

	dropAction(card) {
		card.face_up = true
		emit_faceup_card(card.number)
	}
}

class TrapPosition extends BoardPosition {
	add(card) {
		super.add(card)
		card.face_up = false
	}
}

class DeckPosition extends Position {
	constructor(x, y) {
		super(x, y)
		this.available = true;
	}

	clickAction(card) {
		console.log("click action from deck")
		if(this.available) {
			updates.push({type: "self-position",  cardnum: card.number, positionnum: 0})
		}
		this.available = false
	}

	noClickAction(card) {
		this.available = true;
	}
}

class GravePosition extends Position { }

class LinePosition extends Position {
	constructor(y, attractive) {
		super(0, y, attractive)
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

class HandPosition extends LinePosition { }
class PlayPosition extends LinePosition {
	dropAction(card) {
		card.face_up = true
		emit_faceup_card(card.number)
	}
}

class MyHandPosition extends HandPosition {
	dropAction(card) {
		card.face_up = true
		card.grabbable = false;
	}
}

class OppHandPosition extends HandPosition {
	add(card) {
		super.add(card)
		card.face_up = false
	}
}


class Board {
	constructor() {
		this.positions = []
		this.positions.push(new MyHandPosition(5, true));
		this.positions.push(new OppHandPosition(-5, false));
		for(let i = -2; i <= 2; i++) {
			for(let j = -3; j <= 3; j++) {
				this.positions.push(new BoardPosition(i, j, j != -3))
			}
		}
		this.positions.push(new TrapPosition(-3, 2, true))
		this.positions.push(new TrapPosition(-3, 1, true))
		this.positions.push(new TrapPosition(-3, 0, true))
		this.positions.push(new TrapPosition(3, -2, false))
		this.positions.push(new TrapPosition(3, -1, false))
		this.positions.push(new TrapPosition(3, -0, false))

		this.my_deck = new DeckPosition(3, 1.4, false);
		this.positions.push(this.my_deck)
		this.my_grave = new GravePosition(3, 2.6, true)
		this.positions.push(this.my_grave);

		this.opp_deck = new DeckPosition(-3, -1.4, false);
		this.positions.push(this.opp_deck)
		this.opp_grave = new GravePosition(-3, -2.6, false)
		this.positions.push(this.opp_grave);

		this.positions.push(new PlayPosition(4, true));
		this.positions.push(new PlayPosition(-4, false));
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

	update_postion(card) {
		let min = size * size;
		let min_i = 0;
		for (let i = 0; i < this.positions.length; i++) {
			if(!this.positions[i].attractive) continue;
			let d = this.positions[i].dist(card);
			if(d < min){
				min = d;
				min_i = i;
			}
		}
		if (card.position != this.positions[min_i]) {
			this.positions[min_i].add(card)
			emit_position_update(card.number, min_i)
		}
	}
}

class Game {
	constructor() {
		let l = 0;
		this.deck = []
		this.opp_deck = []
		this.hand = new DedupList()
		this.opponent_hand = new DedupList()
		this.board = new Board()

		this.cards = getCards();
		let i = 0;
		for(let card of this.cards) {
			this.deck.push(new Card(i++, true, card))
			this.board.my_deck.add(this.deck.at(-1))
		}

		i = 0;
		for(let card of this.cards) {
			this.opp_deck.push(new Card(i++, false, card))
			this.board.opp_deck.add(this.opp_deck.at(-1))
		}
		sizes();
		this.stable_deck = [...this.deck];
		this.stable_op_deck = [...this.opp_deck];
	}


	update() {
		this.board.update()
		for(let update of updates) {
			if(update.type == "position") {
				let new_pos = map_position(update.positionnum)
				this.board.positions[new_pos].add(this.stable_op_deck[update.cardnum])
				this.stable_op_deck[update.cardnum].display_preference = frameCount;
			}
			if(update.type == "self-position") {
				let new_pos = update.positionnum
				this.board.positions[new_pos].add(this.stable_deck[update.cardnum])
				this.board.positions[new_pos].dropAction(this.stable_deck[update.cardnum])
				this.stable_deck[update.cardnum].display_preference = frameCount;
				emit_position_update(update.cardnum, update.positionnum)
			}
			if(update.type == "faceup") {
				this.stable_op_deck[update.cardnum].face_up = true;
			}
		}
		updates = []

		for(let card of this.deck) {
			card.update(this.board);
		}

		for(let card of this.opp_deck) {
			card.update(this.board);
		}

		this.deck.sort((a, b) => b.display_preference - a.display_preference);
		this.opp_deck.sort((a, b) => b.display_preference - a.display_preference);
	}

	draw() {
		this.board.draw()
		push()
		imageMode(CENTER)
		translate(centerX, centerY);
		rectMode(CENTER);
		this.deck.reverse()
		for(let card of this.deck) {
			card.draw();
		}
		this.deck.reverse()
		this.opp_deck.reverse()
		for(let card of this.opp_deck) {
			card.draw();
		}
		this.opp_deck.reverse()
		pop()
	}

}

let game = null;
function setup() {
	frameRate(60);
	const canvas_elem = document.getElementById("canvas");
	const canvas = createCanvas(windowWidth, windowHeight, canvas_elem);
	sizes();
	back = getBack();
	game = new Game();
}


function draw() {
	background("#1c2b42")
	game.update();
	game.draw()
}

function sizes() {
	card_margin = Math.min(windowWidth / 7, windowHeight / 11);
	size = card_margin * 7;
	card_size = card_margin - margin;
	centerX = windowWidth / 2;
	centerY = windowHeight / 2;
}


function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	sizes();
}
