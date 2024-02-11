#!/usr/bin/env python3

import os
import subprocess

target = os.environ["HOME"] + "/git/Taser-Shoes-the-game/cards/cards/"

names = {}


i = 0
for file in os.listdir(target):
    if "small" in file:
        continue
    subprocess.run(["cp", f"{target}/{file}", f"full/{i}.png"])
    names[file] = i
    i += 1


for file in os.listdir(target):
    if "small" not in file:
        continue
    other_filename = file.split(".")[0] + ".png"
    i = names[other_filename]
    subprocess.run(["convert", f"{target}/{file}", "-fuzz", "5%", "-transparent", "white", f"small/{i}.png"])
