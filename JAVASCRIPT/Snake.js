const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const scoreEl= document.getElementById('score');
const bestEl = document.getElementById('best-score');

const gridSize = 20;
const tileSize = canvas.width / gridSize;

let snake    = [{x:10,y:10}];
let velocity = {x:0, y:0};
let food     = {x:15,y:15};
let score    = 0;
let bestScore= parseInt(localStorage.getItem('bestScore'))||0;
let dirChanged=false;

const foodImg = new Image();
foodImg.src   = 'IMAGES/logo-etu.svg';

updateScore();
updateBest();

function gameLoop(){
  setTimeout(gameLoop,100);
  dirChanged = false;
  const head = {x:snake[0].x+velocity.x, y:snake[0].y+velocity.y};
  snake.unshift(head);

  if(
    head.x<0||head.x>=gridSize||
    head.y<0||head.y>=gridSize||
    snake.slice(1).some(s=>s.x===head.x&&s.y===head.y)
  ){
    canvas.classList.add('shake');
    setTimeout(()=>canvas.classList.remove('shake'),500);
    if(score>bestScore){
      bestScore=score;
      localStorage.setItem('bestScore',bestScore);
      updateBest();
    }
    snake=[{x:10,y:10}];
    velocity={x:0,y:0};
    score=0;
    updateScore();
    randomizeFood();
    return;
  }

  if(head.x===food.x&&head.y===food.y){
    score++;
    updateScore();
    randomizeFood();
  } else {
    snake.pop();
  }

  draw();
}

function draw(){
  ctx.fillStyle='black';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  for(let i=0;i<snake.length;i++){
    const s = snake[i];
    // gradient HSL 120°→270° selon l'indice
    const h = 120 + (i/(snake.length-1)) * (270-120) || 120;
    ctx.fillStyle = `hsl(${h},100%,50%)`;
    ctx.fillRect(s.x*tileSize, s.y*tileSize, tileSize, tileSize);
  }

  if(foodImg.complete){
    ctx.drawImage(foodImg,
      food.x*tileSize, food.y*tileSize,
      tileSize, tileSize
    );
  } else {
    ctx.fillStyle='red';
    ctx.fillRect(
      food.x*tileSize, food.y*tileSize,
      tileSize, tileSize
    );
  }
}

function randomizeFood(){
  do{
    food.x = Math.floor(Math.random()*gridSize);
    food.y = Math.floor(Math.random()*gridSize);
  } while(snake.some(s=>s.x===food.x&&s.y===food.y));
}

function updateScore(){ scoreEl.textContent = 'Score : '+score; }
function updateBest() { bestEl.textContent = 'Meilleur score : '+bestScore; }

document.addEventListener('keydown', e=>{
  if(dirChanged) return;
  const {x:vx,y:vy}=velocity;
  if(e.key==='ArrowUp'   && vy===0){ velocity={x:0,y:-1}; dirChanged=true; }
  if(e.key==='ArrowDown' && vy===0){ velocity={x:0,y:1};  dirChanged=true; }
  if(e.key==='ArrowLeft' && vx===0){ velocity={x:-1,y:0}; dirChanged=true; }
  if(e.key==='ArrowRight'&& vx===0){ velocity={x:1,y:0};  dirChanged=true; }
});

gameLoop();
