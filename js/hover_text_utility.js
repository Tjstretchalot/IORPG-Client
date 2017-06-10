// This is meant to make it easier to use iorpg.create_spell_hovered_from_data
// It is meant to be used on /hover_text_utility.html

// You are supposed to change the data variable in javascript and call redraw()
// it will then show the drawing on the canvas

var data = {
  width: 124, height: 147, image_index_str: "BLOCK_STANDARD",
  ellipse: { x: 67, y: 37, width: 55, height: 35 },
  title: { x: 48, y: 20, text: "TAUNT" },
  description: [ { x: 20, y: 40, text: "Forces an enemy" }, { x: 33, y: 55, text: "to attack you" } ],
  v_bottom: { x: 50, y: 81 }, v_0: { x: 50, y: 70 },
  v_1: { x: 57, y: 72 }, 
}

// this is just a shorthand of data.description which is pretty long
var gdesc = function(i) {
  return data.description[i];
}

var rewidth = function() {
  data.width = data.ellipse.x + data.ellipse.width + 2;
}

var exp = function() {
  return JSON.stringify(data);
}

var redraw = function() {
  if(iorpg.resource_loading_counter > 0) {
    return;
  }
  canvas = document.getElementById("utility_canvas");
  ctx = this.canvas.getContext("2d");
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  iorpg.__create_spell_hovered_from_data(canvas, ctx, data);
  
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0.5, 0.5);
  ctx.lineTo(canvas.width - 0.5, 0.5);
  ctx.lineTo(canvas.width - 0.5, canvas.height - 0.5);
  ctx.lineTo(0.5, canvas.height - 0.5);
  ctx.closePath();
  ctx.stroke();
}

iorpg.position_loading = function(){};
iorpg.load_images();

var requ_anim_frame = function(timestamp) {
  redraw();
  
  window.requestAnimationFrame(requ_anim_frame);
};

requ_anim_frame();