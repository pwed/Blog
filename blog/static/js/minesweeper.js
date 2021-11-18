console.log("minesweeper")

const d = document
const pc = d.getElementsByClassName("post-content")[0];
pc.style.width = "100%";
pc.innerHTML = `<h1>Word Search </h1>
<p> Select the tiles and click check</p>

<table >
 <tr>
 
 <td  style='vertical-align:top; padding:10px'> 
 <canvas id="canvas" width="320" height="320"  
 title='select letters and press check'
  onmousedown="mousedown=true;toggleStart(event)" onmouseup="mousedown=false;"
 onmousemove="selectWord(event);"  tabindex="0"></canvas>
 </td>
 
 <td  style='vertical-align:top; padding:10px'> 
 
 <div style="width:150px; "><label style=' border:1px solid lightGrey;width:148px;'>
 correct words</label><br> <textArea id="answers" 
style="width:120px;height:280px" > </textarea><br>
</div>
 </td>
 
 
 
 </tr>
 
 
 </table>

<button onclick="checkWord()" title="checks if word is on the list.">check word</button>
<button onclick="restart();"  title="Clears this grid">restart</button>
<label style=' border:1px solid lightGrey;width:148px;'>
 To find:</label>
<label id='rest' style=' border:1px solid red;width:148px;'>
 </label>
 <button onclick="showAnswers();"  title="shows rest of words">Show Answers</button>
 <p id='reveal' style="color:red"></p>
 
<br>`
// const canvas = d.getElementById('minesweeper');
// const ctx = canvas.getContext("2d");

// ctx.fillStyle = "#FF0000"
// ctx.fillRect(0,0,150,75)

var canvas;            
var context;
var gridWidth=8;
var gridHeight=8;
var tileSize=40;

                  
var selects=[];                  // holds coords of selected tiles

var mousedown=false;             // tells if mouse is down or not

                                         // the grid is a 2-dimensional Array with info
var grid= [["W","S","F","T","O","S","P","M"],
["O","T","O","A","D","T","O","U"],
["L","A","X","O","L","O","T","L"],
["F","R","O","G.","O","A","T","E"],
["B","F","M","A","F","T","E","N"],
["L","I","O","N","B","I","R","D"],
["O","S","L","T","A","P","I","R"],
["P","H","E","R","O","N","M","T"]];

var wordArray=["STARFISH","FISH","LION",          ///  wordArray contains the correct search words
"AXOLOTL","FOX","TOAD","FROG","MULE","OTTER",
"GOAT","STOAT","MOLE","HERON","ANT","WOLF","BIRD","TAPIR"];


var wordsCopy=["STARFISH","FISH","LION",              // a copy is needed to reset original values
"AXOLOTL","FOX","TOAD","FROG","MULE","OTTER","GOAT",
"STOAT","MOLE","HERON","ANT","WOLF","BIRD","TAPIR"];






//////////////// SELECT WORD ///////////////////////////////

function selectWord(event){          // tiles are selected when mouse moves
if(mousedown){                            // only when mouse is down(drag)
var rect=canvas.getBoundingClientRect();
var X= event.x-rect.left;                 // convert the mouse-coords to canvas-coords
var Y= event.y-rect.top;
var  x= Math.floor(X/tileSize);           // divide by tileSize  to get tile-positions
var  y= Math.floor(Y/tileSize);

                                          // only when tile-position changes, the new position is added

if((selects[selects.length-1][0]!=x && selects[selects.length-1][1]==y)||
 (selects[selects.length-1][0]==x && selects[selects.length-1][1]!=y)){

selects.push([x,y]);                          // selected Tiles adds coords(x,y) 
grid[x][y]=grid[x][y]+'s';                      // tile wth coords (x,y)add S to show its selected
draw(x,y);                                       // draw  tile x,y

} 
     
}
}




///////// TOGGLE START  ////////////////////////////////////////

function toggleStart(event){              // starts new array of selected Tiles
var rect=canvas.getBoundingClientRect();
var X= event.x-rect.left;
var Y= event.y-rect.top;
var  x= Math.floor(X/tileSize);          // convert mouse coords to grid coords 
var  y= Math.floor(Y/tileSize);


if (selects.length){                   // if selects array is not empty,
                                       // for all:take off 's' to un-select 
  for(var j=0;j<selects.length;j++){
  grid[selects[j][0]][selects[j][1]]=grid[selects[j][0]][selects[j][1]].replace(/s/g,"");
 draw(selects[j][0],selects[j][1]);
}}

selects=[];                           // empty selects-array
selects.push([x,y])                  // insert new positions
grid[x][y]+='s';                       // add S to select this grid-position

draw(x,y);

}



//////////////////// CHECK WORD //////////////////////////////////////////////

function checkWord(){                      // will check if selected tiles form search-word 
	
 var word='';

for(var i=0;i<selects.length;i++){         // for all selected tiles
var x= selects[i][0];                      
var y= selects[i][1];
var letter=grid[x][y].charAt(0);               // get only first character(this holds letter) 
grid[x][y]=grid[x][y].replace(/s/g,'');         // strip off 's' to un-select
word+=letter;                                   // add letter to word
}

var index=wordArray.indexOf(word);


  if(index!=-1){                       // if index is not -1, the word exists in wordArray
  wordArray.splice(index,1);           // take word off list
   for(var i=0;i<selects.length;i++){
var x= selects[i][0];
var y= selects[i][1];
grid[x][y]+='c';                       //  add a 'c' to show its correct
}
document.getElementById('answers').value+='\n'+word;          // write found word on list

document.getElementById('rest').innerHTML=(wordArray.length);     // show rest-number
}

 drawAll();
 
}

////////////////////////// SHOW ANSWERS ///////////////////////////////////////////////

function showAnswers(){
var reveal=document.getElementById('reveal')
for (var i=0;i<wordArray.length;i++){
reveal.innerHTML +='  '+wordArray[i];        // add next word 
}
}


/////////////////////////// RESTART /////////////////////////////////////

function restart(){                            
for(var x=0;x<grid.length;x++){
	for(var y=0;y<grid[x].length;y++){
	grid[x][y]=grid[x][y].charAt(0);                //  strip off all 'c' and 's' info
		}
		}
drawAll();
document.getElementById('answers').value="";                // empty list
wordArray=wordsCopy.slice(0);                              // restore wordArray from copy
document.getElementById('rest').innerHTML=(wordArray.length); 
}


///////////////////////  DRAW FUNCTION ////////////////////////


function draw(x,y){                            // draw this tile position
canvas=document.getElementById('canvas');
context=canvas.getContext('2d');
context.font='Georgia 22px';

 var tile=grid[x][y];                    // get tile information
if(tile.length==1){                      // normal letter: make white
  context.fillStyle='white';
  }
  else if(tile.charAt(tile.length-1)=='c'){      /// correct : make green
  context.fillStyle='green';
  }
else if(tile.charAt(tile.length-1)=='s'){       // selected : make yellow
  context.fillStyle='yellow';
  }
      letter=tile.charAt(0);                   // the letter sits in first position

  
      context.fillRect(x*tileSize,y*tileSize,tileSize,tileSize);         // background  
  	  context.strokeText(letter,(x+0.5)*tileSize,(y+0.5)*tileSize);      // letter
      context.strokeRect(x*tileSize,y*tileSize,tileSize,tileSize);        // outline   
} 
  
  ///////////////////// DRAW ALL ///////////////////////////////////////////
                                                                
  function drawAll(){                   // draws all the tiles of grid
	for (var x=0;x<gridWidth;x++){
  		for (var y=0;y<gridHeight;y++){
  			draw(x,y);
  			}
  		}
  }


/////////////////////  DRAW ///////////////////////////////////


drawAll();
document.getElementById('rest').innerHTML=(wordArray.length); 