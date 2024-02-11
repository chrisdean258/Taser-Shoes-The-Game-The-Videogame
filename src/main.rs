#![allow(dead_code)]
use clap::Parser;
use futures::{stream::SplitSink, SinkExt, StreamExt};
// use futures::{FutureExt, StreamExt};
use serde::Deserialize;
use std::{collections::HashMap, path::PathBuf, sync::Arc};
use tokio::sync::{oneshot, RwLock};
use warp::{
    ws::{Message, WebSocket},
    Filter, Rejection, Reply,
};

#[derive(Parser, Debug)]
pub struct Args {
    #[arg(short, long, default_value_t = 8080)]
    pub port: u16,
    #[arg(short, long)]
    pub root: Option<PathBuf>,
}

#[derive(Deserialize, Debug)]
struct StartGameRequest {
    name: String,
    code: String,
}

#[derive(Debug)]
struct Connections {
    cons: HashMap<
        String,
        (
            SplitSink<WebSocket, Message>,
            oneshot::Sender<SplitSink<WebSocket, Message>>,
        ),
    >,
}

async fn client_connection(code: String, ws: WebSocket, users: Arc<RwLock<Connections>>) {
    eprintln!("websocket handler {code}");
    let (client_ws_sender, mut client_ws_rcv) = ws.split();
    let mut all_users = users.write().await;

    let mut sink = match all_users.cons.remove(&code) {
        Some((sink, chan)) => {
            drop(all_users);
            eprintln!("found for partner on code={code}");
            chan.send(client_ws_sender).expect("Oneshot");
            sink
        }
        None => {
            let (sender, reciever) = oneshot::channel();
            eprintln!("waiting for partner on code={code}");
            all_users.cons.insert(code, (client_ws_sender, sender));
            drop(all_users);
            reciever.await.expect("broken oneshot")
        }
    };

    while let Some(msg) = client_ws_rcv.next().await {
        let msg = msg.expect("Ws");
        eprintln!("{msg:?}");
        match sink.send(msg).await {
            Ok(_) => (),
            Err(_) => break,
        }
    }
}

async fn ws_handler(
    code: String,
    ws: warp::ws::Ws,
    users: Arc<RwLock<Connections>>,
) -> Result<impl Reply, Rejection> {
    Ok(ws.on_upgrade(|websocket| client_connection(code, websocket, users)))
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let args = Args::parse();
    let port = args.port;
    let log = warp::log("cards");
    let connections = Arc::new(RwLock::new(Connections {
        cons: HashMap::new(),
    }));

    let _index = warp::get()
        .and(warp::fs::file("html/index.html"))
        .map(|reply| {
            eprintln!("getting index");
            reply
        });

    let html = warp::fs::dir("html"); //.or(index);

    let css = warp::path("css").and(warp::fs::dir("css")).map(|reply| {
        eprintln!("getting css");
        warp::reply::with_header(reply, "content-type", "text/css")
    });

    let js = warp::path("js").and(warp::fs::dir("js")).map(|reply| {
        eprintln!("getting js");
        warp::reply::with_header(reply, "content-type", "text/javascript")
    });

    let cards = warp::path!("cards" / "full" / ..)
        .and(warp::fs::dir("./cards/full"))
        .map(|reply| {
            warp::reply::with_header(reply, "content-type", "image/png")
        });

    let cards = warp::path!("cards" / "small" / ..)
        .and(warp::fs::dir("./cards/small"))
        .map(|reply| {
            warp::reply::with_header(reply, "content-type", "image/png")
        })
        .or(cards);
    let cards = warp::path!("cards" / "cards.json")
        .and(warp::fs::file("cards/cards.json"))
        .or(cards);

    let start_game = warp::path("game")
        .and(warp::post())
        .and(warp::body::form::<StartGameRequest>())
        .and(warp::fs::file("html/game.html"))
        .map(|req: StartGameRequest, reply| {
            eprintln!("got {req:?}");
            warp::reply::with_header(reply, "set-cookie", format!("code={}", req.code))
        });

    let users = warp::any().map(move || connections.clone());
    let ws = warp::path!("ws" / String)
        .and(warp::ws())
        .and(users)
        .and_then(ws_handler);

    let server = css
        .or(js)
        .or(start_game)
        .or(cards)
        .or(ws)
        .or(html)
        .with(log);

    eprintln!("Serving on 0.0.0.0:{port}");
    warp::serve(server).run(([0, 0, 0, 0], port)).await;
    Ok(())
}
