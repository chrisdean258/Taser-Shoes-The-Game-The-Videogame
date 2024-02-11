const socket = new WebSocket("ws://localhost:8080/ws");

socket.addEventListener("message", (event) => {
	console.log("Message from server ", event.data);
	updates.push(JSON.parse(event.data))
});

function emit(msg) {
	console.log("sending", JSON.stringify(msg))
	socket.send(JSON.stringify(msg))
}

function emit_position_update(cardnum, positionnum) {
	emit({type: "position", cardnum: cardnum, positionnum: positionnum})
}

function emit_faceup_card(cardnum) {
	let v = {type: "faceup", cardnum: cardnum}
	console.log(v)
	emit(v)
}

