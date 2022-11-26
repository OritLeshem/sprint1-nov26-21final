
'use strict'
var gGame = {
  isOn: false,
  shownCount: 0,
  markedCount: 0,
  secsPassed: 0,
  isHint: false
}

// DOM SELECTORS :
var elTimer = document.querySelector('.time')
var elgGameMarkedCount = document.querySelector('.marked')
var elgGMoves = document.querySelector('.moves')
var elShownCells = document.querySelector('.shown')
var elGameOver = document.querySelector('.msg')
var elSmiley = document.querySelector('.smiley')
var elHint = document.querySelector('.hint')

// GLOBAL VARIABLES :
var timmy
var gStartPos
var gBoard
var gMoves = 0
var gBooms = []
var gLevel = { SIZE: 4, MINES: 2, LIVES: 1 }
const MINE = '💣'
const MARK = '❗️'
const HEART = '❤️'
var gIsShowingHint = false

function onInitGame() {
  gStartPos = null
  clearInterval(timmy)
  gGame.isOn = true
  gBoard = buildBoard()
  renderBoard(gBoard)
  gGame.secsPassed = 0
  gMoves = 0
  elGameOver.style.display = "none"
  elgGMoves.innerText = `MOVES : ${gMoves}`
  gGame.shownCount = 0
  elShownCells.innerText = `SHOWN : ${gGame.shownCount}`
  timmy = setInterval(showTime, 1000);
  elSmiley.innerHTML = `<div class="smiley-icon" onclick="onInitGame()"><span>😃</span></div>`
  lives()
  elHint.style.display = "block"

}

function setMinesNegsCount(gBoard) {
  for (var i = 0; i < gLevel.SIZE; i++) {
    for (var j = 0; j < gLevel.SIZE; j++) {
      if (i === gStartPos.i && j === gStartPos.j) continue//dont add number to start pos
      gBoard[i][j].minesAroundCount = countNeighbors(i, j, gBoard)
    }
  }
}

function buildBoard() {
  const board = []
  for (var i = 0; i < gLevel.SIZE; i++) {
    board[i] = []
    for (var j = 0; j < gLevel.SIZE; j++) {
      board[i][j] = { minesAroundCount: 0, isShown: false, isMine: false, isMarked: false, relatedStartGamePoint: false }
    }
  }
  return board
}

function renderBoard(board) {
  gGame.shownCount = 0
  const elBoard = document.querySelector('.board')
  var strHTML = ''
  for (var i = 0; i < board.length; i++) {
    strHTML += '<tr>\n'
    for (var j = 0; j < board[0].length; j++) {
      const currCell = board[i][j]
      var cellClass = getClassName({ i: i, j: j })
      if (!currCell.isShown) cellClass += ' unshown'
      strHTML += `\t<td class="cell ${cellClass}"  oncontextmenu="cellMarked(event, this,${i},${j})" onclick="cellClicked(this,${i},${j})" >\n`
      if (!currCell.isShown) {
        cellClass += 'unshown'
        if (currCell.isMarked) strHTML += MARK
      }
      else {
        if (currCell.isMine) strHTML += MINE
        if (currCell.minesAroundCount > 0 && !currCell.isMine) strHTML += currCell.minesAroundCount
        gGame.shownCount++
        elShownCells.innerText = `SHOWN : ${gGame.shownCount}`
        if (currCell.isMarked) {
          currCell.isMarked = false//was marked but shown,should be again not marked
          gGame.markedCount-- //count down the marked that was removed
        }
        elgGameMarkedCount.innerText = `MARKED : ${gGame.markedCount}`
      }
      strHTML += '\t</td>\n'
    }
    strHTML += '</tr>\n'
  }
  elBoard.innerHTML = strHTML
}

function cellMarked(e, elCell, i, j) {
  e.preventDefault();
  if (gGame.markedCount === gLevel.MINES) return//can't mark more than the mines
  if (!gGame.isOn) return
  if (gBoard[i][j].isMarked === false) {
    gBoard[i][j].isMarked = true
    gGame.markedCount++
    elgGameMarkedCount.innerText = `MARKED : ${gGame.markedCount}`
    renderBoard(gBoard)
    checkGameOver()
  } else {
    gBoard[i][j].isMarked = false
    gGame.markedCount--
    elgGameMarkedCount.innerText = `MARKED : ${gGame.markedCount}`
    renderBoard(gBoard)
    checkGameOver()
  }
}

function expandShownFor3sec(cellI, cellJ, gBoard) {
  gIsShowingHint = true
  gBoard[cellI][cellJ].isShown = true


  for (var i = cellI - 1; i <= cellI + 1; i++) {
    if (i < 0 || i >= gBoard.length) continue
    for (var j = cellJ - 1; j <= cellJ + 1; j++) {
      if (i === cellI && j === cellJ) continue
      if (j < 0 || j >= gBoard[i].length) continue
      if (gBoard[i][j].isShown === true) gBoard[i][j].wasShown = true
      gBoard[i][j].isShown = true
      renderBoard(gBoard)
    }
  }
  setTimeout(() => {

    for (var i = cellI - 1; i <= cellI + 1; i++) {
      if (i < 0 || i >= gBoard.length) continue
      for (var j = cellJ - 1; j <= cellJ + 1; j++) {
        // if (i === cellI && j === cellJ) continue
        if (j < 0 || j >= gBoard[i].length) continue
        gBoard[i][j].isShown = false
        if (gBoard[i][j].wasShown === true) {
          gBoard[i][j].isShown = true
          gBoard[i][j].wasShown = false
        }
        renderBoard(gBoard)
        gIsShowingHint = false
      }
    }
    gGame.isHint = false
    elHint.style.display = "none"
  }, '2000')

}

function cellClicked(elCell, clickedI, clickedJ) {
  if (gGame.isHint && !gIsShowingHint) {
    console.log("ghit is true")
    expandShownFor3sec(clickedI, clickedJ, gBoard)
  }
  else {
    if (!gGame.isOn) return
    if (gMoves === 0) {
      gStartPos = { i: clickedI, j: clickedJ }
      gBoard[clickedI][clickedJ].isShown = true
      arrWithoutStartPos(clickedI, clickedJ, gBoard)
      gMoves++
      var elgGMoves = document.querySelector('.moves')
      elgGMoves.innerText = `Moves : ${gMoves}`
      renderBoard(gBoard)
    }
    else {
      addMines()
      setMinesNegsCount(gBoard)
      gMoves++
      var elgGMoves = document.querySelector('.moves')
      elgGMoves.innerText = `Moves : ${gMoves}`
      gBoard[clickedI][clickedJ].isShown = true/////////////////
      if (gBoard[clickedI][clickedJ].minesAroundCount === 0 && gBoard[clickedI][clickedJ].isMine === false) {
        expandShown(gBoard, elCell, clickedI, clickedJ)
      }
      renderBoard(gBoard)
      checkGameOver(clickedI, clickedJ)
    }
  }
}

function expandShown(gBoard, elCell, cellI, cellJ) {
  var neighborsCount = 0
  for (var i = cellI - 1; i <= cellI + 1; i++) {
    if (i < 0 || i >= gBoard.length) continue
    for (var j = cellJ - 1; j <= cellJ + 1; j++) {
      if (i === cellI && j === cellJ) continue
      if (j < 0 || j >= gBoard[i].length) continue
      gBoard[i][j].isShown = true
    }
  }
  gBoard[cellI][cellJ].minesAroundCount = neighborsCount
  return neighborsCount
}

function checkGameOver(clickedI, clickedJ) {
  var elGameOver = document.querySelector('.msg')
  if (gGame.shownCount + gGame.markedCount === gLevel.SIZE * gLevel.SIZE) {
    gGame.isOn = false
    elGameOver.style.display = "block"
    elGameOver.innerText = "YOU WON!"
    smiley()
    clearInterval(timmy)
  }
  if (gBoard[clickedI][clickedJ].isMine) {
    if (gLevel.LIVES === 0) {
      for (var b = 0; b < gBooms.length; b++) {
        gBoard[gBooms[b].i][gBooms[b].j].isShown = true
      }
      renderBoard(gBoard)
      clearInterval(timmy)
      gGame.isOn = false
      elGameOver.style.display = "block"
      elGameOver.innerText = "GAME OVER"
      smiley()
    } else {
      gLevel.LIVES--
      lives()
      smiley()
    }
  }
}

function onLevel(elBtnLevel, level, mine) {

  gLevel.SIZE = level
  gLevel.MINES = mine
  onInitGame()

  if (mine === 2) {
    gLevel.LIVES = 1
    lives()
    smiley()
  }
  else {
    gLevel.LIVES = 3
    lives()
    smiley()
  }
}

function lives() {
  const elLives = document.querySelector('.lives')
  var strHTML = ''
  for (var i = 0; i < gLevel.LIVES; i++) {
    strHTML += `<div class="heart" >${HEART}</div>`
  }
  elLives.innerHTML = strHTML
}

function smiley() {
  const elSmiley = document.querySelector('.smiley')
  var strHTML = `<div class="smiley-icon" onclick="onInitGame()"><span>😃</span></div>`
  if (elGameOver.innerText === "YOU WON!") strHTML = `<div class="smiley-icon" onclick="onInitGame()"><span>😎</span></div>`
  else {
    if (gLevel.MINES === 2) {
      if (gLevel.LIVES === 0) strHTML = `<div class="smiley-icon" onclick="onInitGame()"><span>🤯</span></div>`
    }
    if (gLevel.MINES > 2) {
      if (gLevel.LIVES === 3)`<div class="smiley-icon" onclick="onInitGame()"><span>😃</span></div>`
      if (gLevel.LIVES < 3) strHTML = `<div class="smiley-icon" onclick="onInitGame()"><span>🤯</span></div>`
    }

  }
  elSmiley.innerHTML = strHTML
}

function getClassName(location) {
  const cellClass = 'cell-' + location.i + '-' + location.j
  return cellClass
}

function arrWithoutStartPos(clickedI, clickedJ, gBoard) {
  var noStartposes = []
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[0].length; j++) {
      if (i === clickedI && j === clickedJ) continue //could usegStartPos
      noStartposes.push({ i: i, j: j })
    }
  }
  gBooms = []
  for (var b = 0; b < gLevel.MINES; b++) {
    var randomIndex = getRandomInt(0, noStartposes.length - 1)
    gBooms.push(noStartposes[randomIndex])
    noStartposes.splice(randomIndex, 1)
  }
}

function addMines() {
  for (var b = 0; b < gBooms.length; b++) {
    gBoard[gBooms[b].i][gBooms[b].j].isMine = true
  }
  renderBoard(gBoard)
}

function countNeighbors(cellI, cellJ, mat) {
  var neighborsCount = 0
  for (var i = cellI - 1; i <= cellI + 1; i++) {
    if (i < 0 || i >= mat.length) continue
    for (var j = cellJ - 1; j <= cellJ + 1; j++) {
      if (i === cellI && j === cellJ) continue
      if (j < 0 || j >= mat[i].length) continue
      if (mat[i][j].isMine === true) neighborsCount++
    }
  }
  gBoard[cellI][cellJ].minesAroundCount = neighborsCount
  var elNeg = document.querySelector('h3')
  return neighborsCount
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

function showTime() {
  gGame.secsPassed++;
  let mins = Math.floor(gGame.secsPassed / 60)
  let secs = Math.floor(gGame.secsPassed % 60);
  let output =
    mins.toString().padStart(2, '0') + ':' +
    secs.toString().padStart(2, '0');
  var elH2 = document.querySelector('.time')
  elH2.innerText = `TIME : ${output}`
}

function onHint() {
  gGame.isHint = true

}
function onLightMode(elMode) {
  if (elMode.innerText === "LIGHT MODE") {
    console.log("onlightmode is clicked")
    document.documentElement.style.setProperty('--second-color', 'yellow');
    document.documentElement.style.setProperty('--first-color', 'rgba(225, 222, 222, 0.95)');
    document.documentElement.style.setProperty('--third-color', 'black');
    elMode.innerText = "DARK MODE"
  }
  else {
    elMode.innerText = "LIGHT MODE"
    document.documentElement.style.setProperty('--second-color', 'rgba(243, 243, 5, 0.4)');
    document.documentElement.style.setProperty('--first-color', 'rgba(18, 17, 17, 0.95)');
    document.documentElement.style.setProperty('--third-color', 'rgb(220, 218, 218)');
  }

}