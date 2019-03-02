
const bodyParser = require('body-parser')
const express = require('express')
const logger = require('morgan')
const app = express()
const {
  fallbackHandler,
  notFoundHandler,
  genericErrorHandler,
  poweredByHandler
} = require('./handlers.js')

// For deployment to Heroku, the port needs to be set using ENV, so
// we check for the port number in process.env
app.set('port', (process.env.PORT || 9001))

app.enable('verbose errors')

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(poweredByHandler)

// --- SNAKE LOGIC GOES BELOW THIS LINE ---

const BOARD = {
  height: 0,
  width: 0,
  foodEaten: 0,
  walls: [],
  znakes: []

};

const SLITHERING = {
  x: 0,
  y: 0,
  move: 'right',
  health: 100
};

/*
 * Supporting functions for the strats
 */
 const shuffle = a => {
   let j, x, i;
   for (i = a.length - 1; i > 0; i--) {
     j = Math.floor(Math.random() * (i + 1));
     x = a[i];
     a[i] = a[j];
     a[j] = x;
   }
   return a;
 };

const boardGen = () => {
  let height = BOARD.height;
  let width = BOARD.width;
  let coord1, coord2;

  // set left and right boundaries
  for (let i = 0; i <= height; i++) {
    coord1 = {
      x: -1,
      y: i
    };
    coord2 = {
      x: width,
      y: i
    };
    BOARD.walls.push(coord1, coord2);
  }

  // set top and bottom boundaries
  for (let i = 0; i <= width; i++) {
    coord1 = {
      x: i,
      y: -1
    };
    coord2 = {
      x: i,
      y: height
    };
    BOARD.walls.push(coord1, coord2);
  }
};

const snakeCoords = (znake, bool) => {
  let startIndex = 0;
  for (i = startIndex; i < znake.body.length; i++){
    if (i === znake.body.length - 1) {
      if (bool) BOARD.znakes.push(znake.body[i]);
      else continue;
    }
    else {
      BOARD.znakes.push(znake.body[i]);
    }
  }
};

const equalCheck = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

/*
 * Need to compare snake body, with proposed moves.
 */
const isMoveUnsafe = (move, x, y) => {
  let myPotentialNextMove;

   switch (move) {
     case 'right':
       myPotentialNextMove = {
         x: x + 1,
         y: y
       };
       break;
     case 'down':
       myPotentialNextMove = {
         x: x,
         y: y + 1
       };
       break;
     case 'left':
       myPotentialNextMove = {
         x: x - 1,
         y: y
       };
       break;
     case 'up':
       myPotentialNextMove = {
         x: x,
         y: y - 1
       };
       break;
   }

   // Check the walls and snakes arrays to make sure the move isnt in there
   let isSafe = true;

   console.log("I think I'm here", x, y);
   console.log("and this is my potential next move", myPotentialNextMove);
   for (let coord of BOARD.walls) {
     console.log(coord);
     console.log(myPotentialNextMove);
     if (!equalCheck(coord, myPotentialNextMove)) {
       console.log(`I was here: ${x} ${y} and trying to go ${move}`);
       console.log("but there's a wall at", coord);
       isSafe = false;
       break;
     }
   }
   if (!isSafe) return true;

   for (let coord of BOARD.znakes) {
     //console.log(coord);
     //console.log(myPotentialNextMove);
     if (!equalCheck(coord, myPotentialNextMove)) {
       console.log(`I was here: ${x} ${y} and trying to go ${move}`);
       console.log("but there's a snake at", coord);
       isSafe = false;
       break;
     }
   }
   if (!isSafe) return true;

   for (let coord of BOARD.znakes) {
     //console.log(coord);
     //console.log(myPotentialNextMove);
     if (!equalCheck(coord, myPotentialNextMove)) {
       console.log(`I was here: ${x} ${y} and trying to go ${move}`);
       console.log("but there's a snake at", coord);
       isSafe = false;
       break;
     }
   }
   if (!isSafe) return true;

   else {
     return false;
   }
 };

 const target = (headX, headY, targetX, targetY) => {
   let move = SLITHERING.move;

   // Going right if safe
   if (targetX > headX){
     if (targetY === headY){
       if(!isMoveUnsafe('right', headX, headY)){
         move = 'right';
       }
     }
     // Going to down or right if safe
     else if (targetY > headY){
       if(!isMoveUnsafe('down', headX, headY)){
         move = 'down';
       }
       else if(!isMoveUnsafe('right', headX, headY)){
         move = 'right';
       }
     }
     // Going up or right if safe
     else {
       if(!isMoveUnsafe('up', headX, headY)){
         move = "up";
       }
       else if(!isMoveUnsafe('right', headX, headY)){
         move = 'right';
       }
     }
   }

   // Target is to the left
   else if (targetX < headX){
     // Going right if safe
     if (targetY === headY){
       if(!isMoveUnsafe('left', headX, headY)){
         move = 'left';
       }
     }
     // Going to down or left if safe
     else if (targetY > headY){
       if(!isMoveUnsafe('down', headX, headY)){
         move = 'down';
       }
       else if(!isMoveUnsafe('left', headX, headY)){
         move = 'left';
       }
     }
     // Going up or left if safe
     else {
       if(!isMoveUnsafe('up', headX, headY)){
         move = 'up';
       }
       else if(!isMoveUnsafe('left', headX, headY)){
         move = 'left';
       }
     }
   }
   else {
   // Target is above or below
     if(!isMoveUnsafe('down', headX, headY)){
       move = 'down'
     }
     else {
       // Going up if safe
       if(!isMoveUnsafe('up', headX, headY)){
         move = 'up';
       }
     }

    }
   return move;
 };

const hungryBoy = (x, y, food) => {
  let closestFoodX = 0;
  let closestFoodY = 0;
  let length = 100;
  let pathLength, xd, yd;

// Closest Food, to snake,

  for(let f of food) {
    xd = Math.pow(f.x - x, 2);
    yd = Math.pow(f.y - y, 2);
    pathLength = Math.sqrt(xd + yd);

    if(pathLength < length){
      closestFoodX = f.x;
      closestFoodY = f.y;
      pathLength = length;

    }
  }
  return target(x, y, closestFoodX, closestFoodY, true);
};

const tailChaser = (x, y, tail) => {
  return target(x, y, tail.x, tail.y, true);
};


// Handle POST request to '/start'
app.post('/start', (request, response) => {
  // NOTE: Do something here to start the game
  const z = request.body;
  const me = z.you;
  const znake = z.you.body;
  const znakeHead = znake[0];
  const znakes = z.board.snakes;
  const health = z.you.health;

  BOARD.height = z.board.height;
  BOARD.width = z.board.width;
  BOARD.walls = [];
  boardGen();

  SLITHERING.x = znakeHead.x;
  SLITHERING.y = znakeHead.y;
  SLITHERING.health = health;

  for (let thisZnake of znakes) {
    snakeCoords(thisZnake, true);
  }

  // Response data
  const data = {
    color: 'SpringGreen',
    headType: 'smile',
    tailType: 'skinny',
  }

  return response.json(data)
})

// Handle POST request to '/move'
app.post('/move', (request, response) => {
  // NOTE: Do something here to generate your move
  const start = new Date();

  //console.log("\nturn number", request.body.turn);

  const z = request.body;
  const me = z.you;
  const znake = z.you.body;
  const znakeHead = znake[0];
  const znakes = z.board.snakes;
  const health = z.you.health;
  const znakeTail = znake[znake.length - 1];
  const food = z.board.food;

  BOARD.znakes = [];

  //console.log(znake);
  //console.log(food.length);
  //console.log(food);

  // Checking to see if weatin!
  if (health > SLITHERING.health) {
    BOARD.foodEaten += 1;
  }

  let move = SLITHERING.move;

  if (health < 101) {
    console.log('Get in my belly!')
    move = hungryBoy(znakeHead.x, znakeHead.y, food);
    //console.log(move);
  }
/*
  for (let thisZnake of znakes) {
    console.log(thisZnake);
  }
*/

  //console.log(znakes);


  SLITHERING.move = move;
  SLITHERING.x = znakeHead.x;
  SLITHERING.y = znakeHead.y;
  SLITHERING.health = health;

  // Response data
  const data = {
    move: move
  };

  console.log(`Slithering ${move}`);
  const end = new Date();
  const totalTime = end.getTime() - start.getTime();
  console.log(totalTime, "ms");

  return response.json(data)
})

app.post('/end', (request, response) => {
  // NOTE: Any cleanup when a game is complete.
  (BOARD.walls = []),
  (BOARD.znakes = []),
  (BOARD.foodEaten = 0);
  return response.json({})
})

app.post('/ping', (request, response) => {
  // Used for checking if this snake is still alive.
  return response.json({});
})

// --- SNAKE LOGIC GOES ABOVE THIS LINE ---

app.use('*', fallbackHandler)
app.use(notFoundHandler)
app.use(genericErrorHandler)

app.listen(app.get('port'), () => {
  console.log('Server listening on port %s', app.get('port'))
})
