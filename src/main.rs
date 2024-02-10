#![allow(dead_code)]
use clap::Parser;
use serde::Deserialize;
use std::fs::File;
use std::io::Read;
use std::path::PathBuf;
use urlencoding::decode;
use warp::Filter;

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

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let args = Args::parse();
    let port = args.port;
    let log = warp::log("cards");

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

    let cards = warp::path!("cards" / String).map(|name: String| {
        let name = decode(&name).expect("utf-8").into_owned();
        let name = format!("cards/{name}");
        let mut f = File::open(&name).expect("no file found");
        let metadata = std::fs::metadata(&name).expect("unable to read metadata");
        let mut buffer = vec![0; metadata.len() as usize];
        let _ = f.read(&mut buffer).expect("buffer overflow");
        warp::http::Response::builder()
            .header("Content-Type", "image/png")
            .body(buffer)
    });

    let start_game = warp::path("game")
        .and(warp::post())
        .and(warp::body::form::<StartGameRequest>())
        .and(warp::fs::file("html/game.html"))
        .map(|req, reply| {
            eprintln!("got {req:?}");
            reply
        });

    let server = css.or(js).or(start_game).or(cards).or(html).with(log);

    eprintln!("Serving on 0.0.0.0:{port}");
    warp::serve(server).run(([0, 0, 0, 0], port)).await;
    Ok(())
}
