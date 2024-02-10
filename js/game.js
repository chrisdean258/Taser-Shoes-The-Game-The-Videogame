let width = window.innerWidth;
let height = window.innerHeight;
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

class Card {
	constructor(x, y) {
		this.home = { x: x, y: y }

	}

	rehome(x, y) {
		this.home = { x: x, y: y }
	}

	draw(x, y) {
		ctx.save()
		console.log(x, y)
		ctx.strokeStyle = "black";
		ctx.strokeRect(x, y, 100, 100);
		ctx.restore()
	}
}

class Game {
	constructor() {
		this.deck = []
		this.graveyard = []
		this.hand = [new Card(), new Card(), new Card(), new Card(), new Card()]
	}

	draw() {
		ctx.save()
		const y = canvas.height - 105;
		const x = (canvas.width - this.hand.length * 105) / 2;
		for(let i = 0; i < this.hand.length; i++) {
			console.log(i, (1 + i) * 105)
			this.hand[i].draw(i * 105 + x, y)
		}

		const size = Math.min(canvas.height - 200, canvas.width - 10);

		const xx = (canvas.width - size) / 2;
		const yy = (canvas.height - size - 110) / 2;

		ctx.save()
		ctx.translate(xx, yy)
		ctx.strokeStyle = "black";
		ctx.strokeRect(0, 0, size, size);
		ctx.beginPath();
		for(let i = 1; i < 5; i++) {
			ctx.moveTo(0, i * size / 5);
			ctx.lineTo(size, i * size / 5);
			ctx.moveTo(i * size / 5, 0);
			ctx.lineTo(i * size / 5, size);
		}
		ctx.stroke()


		ctx.restore()
		ctx.restore()


	}
}

let game = new Game()
game.draw()

function draw() {
	ctx.fillStyle = "green";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	game.draw()
}

function resize() {
	width = window.innerWidth;
	height = window.innerHeight;
	canvas.width = width * .9;
	canvas.height = height * .88;
	draw()
}

addEventListener("resize", resize);
resize()
draw()


