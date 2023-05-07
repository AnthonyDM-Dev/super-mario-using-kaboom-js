kaboom({
    background: [ 0, 0, 0, 1 ],
})

const SPEED = 120
const ENEMY_SPEED = 80
const JUMP_FORCE = 550
const BULLET_SPEED = 250
const BULLET_JUMP_FORCE = 150
const GRAVITY = 1500

function mergeImg(urls) {
	let promises = [];
	for (let url of urls) {
			const img = new Image();
			img.src = url;
			img.crossOrigin = "anonymous";
			promises.push(new Promise((resolve, reject) => {
					img.onload = () => {
							resolve(img);
					};
					img.onerror = () => {
							reject(`failed to load ${url}`);
					};
			}));
	}
	return new Promise((resolve, reject) => {
			Promise.all(promises).then((images) => {
					const canvas = document.createElement("canvas");

					const width = images[0].width;
					const height = images[0].height;
					const totalWidth = images.reduce((acc, curr) => { return acc + curr.width }, 0);
					canvas.width = totalWidth;
					canvas.height = height * images.length;
					const ctx = canvas.getContext("2d");
					if (ctx) {
						images.forEach((img, i) => {
							if (img.width === width && img.height === height) {
								ctx.drawImage(img, 0 + (i * width), 0);
							}
						});
						resolve(ctx.getImageData(0, 0, totalWidth, height));
					} else {
			reject();
		}
			}).catch((error) => reject(error));
	})
}

mergeImg(["/sprites/enemies/goomba/goomba-1.png", "/sprites/enemies/goomba/goomba-2.png"]).then((img) =>
	loadSpriteAtlas(img, {
		"goomba": {
			x: 0,
			y: 0,
			width: 40,
			height: 20,
			sliceX: 2,
			anims: {
				"run": {
					from: 0,
					to: 1,
					speed: 6,
					loop: true,
				}
			}
		}
	})
);

loadSpriteAtlas("sprites/characters-spritesheet.png", {
	"mario": {
		x: 80,
		y: 32,
		width: 224,
		height: 16,
		sliceX: 14,
		anims: {
			"idle": 6,
			"run": {
				from: 0,
				to: 2,
				speed: 10,
				loop: true,
			},
			"jump": 4,
			"hit": 5,
		},
	},
	"mario-fire": {
		x: 80,
		y: 80,
		width: 224,
		height: 16,
		sliceX: 14,
		anims: {
			"idle": 6,
			"run": {
				from: 0,
				to: 2,
				speed: 10,
				loop: true,
			},
			"jump": 4,
			"hit": 5,
		},
	},
});
loadSpriteAtlas("sprites/ballfire-spritesheet.png", {
	"fireball": {
		x: 0,
		y: 0,
		width: 48,
		height: 8,
		sliceX: 4,
		anims: {
			"idle": 0,
			"shoot": {
				from: 0,
				to: 3,
				speed: 12,
				loop: true,
			},
		},
	},
});
loadSpriteAtlas("sprites/props-spritesheet.png", {
	"floor": {
		x: 0,
		y: 0,
		width: 32,
		height: 32,
	},
	"wall": {
		x: 32,
		y: 0,
		width: 32,
		height: 32,
	},
	"box": {
		x: 758,
		y: 0,
		width: 132,
		height: 32,
		sliceX: 4,
		anims: {
			"idle": 0,
			"empty": 3
		}
	},
	"flower": {
		x: 824,
		y: 594,
		width: 32,
		height: 32,
	},
	"pipe": {
		x: 0,
		y: 264,
		width: 64,
		height: 64,
	},
	"bar": {
		x: 528,
		y: 296,
		width: 32,
		height: 32,
	},
	"bar-top": {
		x: 528,
		y: 264,
		width: 32,
		height: 32,
	}
});

scene("start", () => {
	gravity(GRAVITY)
	const LEVELS = [
		[
			"M                         o",
			"                          i",
			"   *^*              g   = i",
			"        g           =   = i",
			" =      =          == g = i",
			"===========================",
		],
	]
	const lvlConfig = {
		// define the size of tile block
		width: 32,
		height: 32,
		"=": () => [
			sprite("floor"),
			area(),
			solid(),
			origin("bot"),
			"ground",
			"block",
		],
		"i": () => [
			sprite("bar"),
			area(),
			origin("bot"),
			"flag",
		],
		"o": () => [
			sprite("bar-top"),
			area(),
			origin("bot"),
			"flag",
		],
		"*": () => [
			sprite("wall"),
			area(),
			solid(),
			origin("bot"),
			"wall",
			"block",
		],
		"^": () => [
			sprite("box", { anim: "idle" }),
			area(),
			solid(),
			origin("bot"),
			"box",
			"block",
		],
		"T": () => [
			sprite("pipe"),
			area(),
			solid(),
			scale(.5),
			origin("bot"),
			"pipe",
			"block",
		],
		"g": () => [
			sprite("goomba", { anim: "run" }),
			area(),
			solid(),
			origin("bot"),
			pos(),
			body(),
			move(LEFT, ENEMY_SPEED),
			"enemy",
		],
		"M": () => [
			sprite("mario", { anim: "idle" }),
			area(),
			pos(),
			body(),
			origin("center"),
			scale(1.8),
			{
				hasFire: false,
				fire: spawnBullet,
				isWalkingRight: true,
			},
			"player",
		],
	};

	const level = addLevel(LEVELS[0], lvlConfig)
	const player = get("player")[0]
	const enemies = get("enemy")

	function spawnBullet(p) {
		if (!player.hasFire) return
		const dir = player.isWalkingRight ? 12 : -24;
		console.log(p)
		const fireball = add([
			sprite("fireball", { anim: "shoot" }),
			area(),
			pos(p.x + dir, p.y - 5),
			solid(),
			body(),
			move(player.isWalkingRight ? RIGHT : LEFT, BULLET_SPEED),
			scale(1.8),
			"bullet",
		])
		fireball.onGround(() => {
			fireball.jump(BULLET_JUMP_FORCE)
		})
		fireball.onCollide("block", (obj, col) => {
			if (col.isBottom()) return
			destroy(fireball)
		})
		fireball.onCollide("enemy", (obj, col) => {
			destroy(obj)
		})
	}

	player.onUpdate(() => {
		camPos(player.pos)
		if (player.pos.y >= 480) {
			go("lose")
		}
	})

	player.onGround((target) => {
		if (target.is("enemy")) {
			player.jump(JUMP_FORCE)
			player.play("jump")
			destroy(target)
			return
		}
		if (!isKeyDown("left") && !isKeyDown("right")) {
			player.play("idle")
		} else {
			player.play("run")
		}
	})
	player.onCollide("enemy", (target, collider) => {
		if (collider.isBottom()) {
			player.jump(-10000)
			player.play("jump")
			
		} else {
			go("lose")
		}
	})
	player.onHeadbutt((target) => {
		if (target.is("box")) {
			target.play("empty")
			add([
				sprite("flower"),
				area(),
				solid(),
				scale(.6),
				pos(target.pos.sub(0, 32)),
				origin("bot"),
				"fireflower",
			])
		} else {
			destroy(target)
		}
	})
	player.onCollide("fireflower", (target, collider) => {
			destroy(target)
			player.hasFire = true;
			player.use(sprite("mario-fire"))
	})
	player.onCollide("flag", () => {
		go("win")
	})

	enemies.forEach((enemy) => {
		enemy.onCollide("block", (target, collider) => {
			if (target.is("block") && collider.isLeft()) {
				enemy.use(move(RIGHT, ENEMY_SPEED))
				return
			}
			if (target.is("block") && collider.isRight()) {
				enemy.use(move(LEFT, ENEMY_SPEED))
				return
			}
		})
	})

	onKeyPress("space", () => {
		if (player.isGrounded()) {
			player.jump(JUMP_FORCE)
			player.play("jump")
		}
	})

	onKeyDown("left", () => {
		player.move(-SPEED, 0)
		player.flipX(true)
		player.isWalkingRight = false
		// .play() will reset to the first frame of the anim, so we want to make sure it only runs when the current animation is not "run"
		if (player.isGrounded() && player.curAnim() !== "run") {
			player.play("run")
		}
	})

	onKeyDown("right", () => {
		player.move(SPEED, 0)
		player.flipX(false)
		player.isWalkingRight = true
		if (player.isGrounded() && player.curAnim() !== "run") {
			player.play("run")
		}
	})

	;["left", "right"].forEach((key) => {
		onKeyRelease(key, () => {
			if (player.isGrounded() && !isKeyDown("left") && !isKeyDown("right")) {
				player.play("idle")
			}
		})
	})

	onKeyPress("r", () => {
		if (player.isWalkingRight) {
			player.fire(player.pos, RIGHT)
		} else {
			player.fire(player.pos, LEFT)
		}
	})
})

scene("lose", () => {
	add([
		text("You Lose. Press space to start again.", {
			width: 300,
			size: 16
		}),
		origin("center"),
		pos(center()),
	])
	onKeyPress("space", () => {
		go("start")
	})
})

scene("win", () => {
	add([
		text(`You win! Press space to start again.`, {
			width: 300,
			size: 16,
		}),
		origin("center"),
		pos(center()),
	])
	onKeyPress("space", () => {
		go("start")
	})
})

go("start")