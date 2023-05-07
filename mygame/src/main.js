import kaboom from 'kaboom';

kaboom ({
	global: true,
	fullscreen: true,
	scale: 1,
	debug: true,
	font: "sinko",
	clearColor: [0, 0, 0, 1],
})

loadSprite('mario', 'sprites/mario/mario-sm-1.png');
loadSprite('wall-1', 'sprites/background/wall-1.png');
loadSprite('wall-2', 'sprites/background/wall-2.png');

scene("game", () => {
	addLevel([
    "                          $",
    "                          $",
    "           $$         =   $",
    "  %      ====         =   $",
    "                      =    ",
    "       ^^      = >    =   &",
    "===========================",
	], {
			// define the size of each block
			width: 32,
			height: 32,
			// define what each symbol means, by a function returning a component list (what will be passed to add())
			"=": () => [
					sprite("./background/wall-1.png"),
					area(),
					solid(),
			],
			"$": () => [
					sprite("./background/wall-2.png"),
					area(),
					pos(0, -9),
			],
			"^": () => [
					sprite("./mario/mario-sm-1.png"),
					area(),
					"danger",
			],
	})
	const player = add([
		sprite('mario'),
		pos(100, 100),
		area(),
		body(),
	]);
	
	add([
		rect(width(), 48),
		pos(0, height() - 48),
		outline(4),
		area(),
		solid(),
		color(127, 200, 255),
	]);
	
	add([
		rect(48, 64),
		area(),
		outline(4),
		pos(width(), height() - 48),
		origin("botleft"),
		color(255, 180, 255),
		move(LEFT, 240),
		'tree',
	]);
	
	player.onCollide("tree", () => {
		addKaboom(player.pos);
		shake();
		go("lose");
	});
	
	onKeyPress("space", () => {
		if (player.isGrounded()) {
			player.jump();
		}
	});
})

scene("lose", () => {
	add([
		text("Game Over"),
		pos(center()),
		origin("center"),
])
})

go("game")