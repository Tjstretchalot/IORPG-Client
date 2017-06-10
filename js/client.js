var __IMAGES_counter = 0;
var __FONTS_counter = 0;
var __GAME_STATES_counter = 0;
var iorpg = {
  IMAGES: { 
    "LOADING": __IMAGES_counter++,
    "SELECT_HERO_TITLE": __IMAGES_counter++,
    "SELECT_WARRIOR_STANDARD": __IMAGES_counter++,
    "SELECT_WARRIOR_HOVERED": __IMAGES_counter++,
    "SELECT_WARRIOR_PRESSED": __IMAGES_counter++,
    "SELECT_HUNTER_STANDARD": __IMAGES_counter++,
    "SELECT_HUNTER_HOVERED": __IMAGES_counter++,
    "SELECT_HUNTER_PRESSED": __IMAGES_counter++,
    "SELECT_PRIEST_STANDARD": __IMAGES_counter++,
    "SELECT_PRIEST_HOVERED": __IMAGES_counter++,
    "SELECT_PRIEST_PRESSED": __IMAGES_counter++,
    "WARRIOR": __IMAGES_counter++, 
    "WARRIOR_SWORD": __IMAGES_counter++,
    "HUNTER": __IMAGES_counter++, 
    "HUNTER_BOW": __IMAGES_counter++,
    "PRIEST": __IMAGES_counter++,
    "PRIEST_WAND": __IMAGES_counter++,
    
    // spells
    "SPELL_BACKGROUND": __IMAGES_counter++,
    "LESSER_HEAL_STANDARD": __IMAGES_counter++,
    "LESSER_HEAL_HOVERED": __IMAGES_counter++,
    "LESSER_HEAL_PRESSED": __IMAGES_counter++,
    "GREATER_HEAL_STANDARD": __IMAGES_counter++,
    "GREATER_HEAL_HOVERED": __IMAGES_counter++,
    "GREATER_HEAL_PRESSED": __IMAGES_counter++,
    "HEALING_STRIKE_STANDARD": __IMAGES_counter++,
    "HEALING_STRIKE_HOVERED": __IMAGES_counter++,
    "HEALING_STRIKE_PRESSED": __IMAGES_counter++,
    "PUSH_STANDARD": __IMAGES_counter++,
    "PUSH_HOVERED": __IMAGES_counter++,
    "PUSH_PRESSED": __IMAGES_counter++,
    "BLOCK_STANDARD": __IMAGES_counter++,
    "BLOCK_HOVERED": __IMAGES_counter++,
    "BLOCK_PRESSED": __IMAGES_counter++,
    "SHOOT_STANDARD": __IMAGES_counter++,
    "SHOOT_HOVERED": __IMAGES_counter++,
    "SHOOT_PRESSED": __IMAGES_counter++,
    "DELIBERATE_SHOT_STANDARD": __IMAGES_counter++,
    "DELIBERATE_SHOT_HOVERED": __IMAGES_counter++,
    "DELIBERATE_SHOT_PRESSED": __IMAGES_counter++,
    
    // modifiers
    "MODIFIER_BLOCKED": __IMAGES_counter++,
    
    // misc
    "FULL_HEALTH_BAR": __IMAGES_counter++,
    "FULL_MANA_BAR": __IMAGES_counter++
  },
  FONTS: {
    "TITLE": __FONTS_counter++,
    "SMALL_TITLE": __FONTS_counter++,
    "PARAGRAPH": __FONTS_counter++
  },
  GAME_STATES: {
    "LOADING": __GAME_STATES_counter++,
    "LOADING_TRANSITION": __GAME_STATES_counter++,
    "SELECT_HERO": __GAME_STATES_counter++,
    "PLAYING": __GAME_STATES_counter++
  },
  HEROES: {
    "WARRIOR": 1,
    "HUNTER": 2,
    "PRIEST": 3
  },
  SOCKET_MESSAGE_TYPES: {
    "HELLO": 1,
    "TICK": 2,
    "START_MOVE": 3,
    "STOP_MOVE": 4,
    "CAST_SPELL": 5
  },
  DIRECTIONS: {
    "RIGHT": 1,
    "LEFT": 2,
    "UP": 3,
    "DOWN": 4
  },
  game_state: 0,
  images: {},
  fonts: {},
  text_cache: [], // contains things of the form { text: text, font_index: number, last_used: number, img: image }
  text_cache_inprogress: [], // contains { text: text, font_index: number }
  resource_loading_counter: 0, // when this is non-zero something is loading
  mouse_pos: { x: -1, y: -1 },
  mouse_left_down: false,
  loading_ui_info: {
    translate: { x: 0, y: 0 },
    width: 0,
    height: 0
  },
  loading_transition_ui_info: {
    destination_y: 0
  },
  select_hero_ui_info: {
    warrior: {
      translate: { x: 0, y: 0 },
      width: 0,
      height: 0,
      hovered: false
    },
    priest: {
      translate: { x: 0, y: 0 },
      width: 0,
      height: 0,
      hovered: false
    },
    hunter: {
      translate: { x: 0, y: 0 },
      width: 0,
      height: 0,
      hovered: false
    }
  },
  playing_ui_info: {
    spells: [
      // objects like { translate: { x: blah, y: blah }, icon_standard: { img: blah, translate: { x: blah, y: blah } }, icon_hovered: { img: blah, translate: { x: blah, y: blah } }, icon_pressed: {...}, hovered: bool }
    ]
  },
  socket: {}, // will be a websocket
  world: {
    timestamp: 0,
    me: { id: 0, hero: 0, name: "", translate: { x: 0, y: 0 }, health: 100, mana: 100 },
    ids_to_indexes: { },
    entities: {
      
    }
  },
  minimap: {
    translate: { x: 0, y: 0 },
    width: 1,
    height: 1, // this will also have an img
    dirty: true
  },
  new_world: { empty: true }, // this is like world but the latest version
  interpolated_timestamp: 0, // what timestamp have we interpolated to
  interpolation_factor: 1,
  last_draw_time: 0.0,
  camera: {
    translate: { x: 0, y: 0 },
    screen_x: function(x) { return x - this.translate.x; },
    screen_y: function(y) { return y - this.translate.y; }
  }
};

// Convert the specified canvas to an image, with the specified callback
//
// notes
//   always draw images or canvas's to the main canvas when possible, it's hardware accelerated
iorpg.canvas_to_image = function(canv, onload_callback) {
  var img = new Image;
  img.width = canv.width;
  img.height = canv.height;
  img.onload = onload_callback;
  img.src = canv.toDataURL("image/png");
  return img
};

// Creates and produces font metrics for the specified font. This allows accurate
// calculation of font height, but is expensive to generate. Using a font metric
// returns O(n) time, where n is the number of characters in the string.
//
// Producing this font height requires a guess for the fonts height, such that the 
// guess is never smaller than the true height of the largest character in the font.
// If unsure, use 2x the font size in pixels.
//
// ex.
//   var fontmetrics = iorpg.create_font_metrics("12px Open-Sans", 20, function() {
//     var str = "asdf";
//     fontmetrics.measure_height(str); // returns { start: number, end: number, height: number }
//     fontmetrics.max_height // a number for the tallest measured character. Should be used instead of measureHeight for long strings.
//     fontmetrics.lowest_start // a number for the smallest offset between the y you give to fillText and the first true y
//     fontmetrics.highest_end // a number for the highest offset between the y you give fillText and the last true y
//   });
//
// notes
//   always cache font metrics, they are expensive to generate
iorpg.create_font_metrics = function(font, high_guessed_max_height, onloadcallback) {
  high_guessed_max_height = Math.max(high_guessed_max_height, 10);
  
  var result = {}
  result.font = font;
  result.loading_counter = 0;
  result.max_height = 0;
  result.lowest_start = high_guessed_max_height;
  result.highest_end = 0;
  
  result.measurements = {}
  
  var measure_letter = function(letter) {
    result.loading_counter++;
    var bknd_canvas = document.createElement("canvas");
    bknd_canvas.width = high_guessed_max_height * 4;
    bknd_canvas.height = high_guessed_max_height * 4;
    var bknd_ctx = bknd_canvas.getContext("2d");
    bknd_ctx.font = font;
    bknd_ctx.fillText(letter, 3, high_guessed_max_height);
    
    setTimeout(function() {
      var img_data = bknd_ctx.getImageData(0, 0, bknd_canvas.width, bknd_canvas.height).data;
      var start_px_y = 0;
      var end_px_y = 0;
      var found_start = false;
      
      var img_data_counter = 0;
      for(var px_y = 0; px_y < bknd_canvas.height; px_y++) {
        for(var px_x = 0; px_x < bknd_canvas.width; px_x++) {
          var px_alpha = img_data[img_data_counter + 3];
          if(px_alpha != 0) {
            if(!found_start) {
              found_start = true;
              start_px_y = px_y;
              img_data_counter += (bknd_canvas.width - px_x) * 4;
              break; // check next row
            }else {
              end_px_y = px_y;
              img_data_counter += (bknd_canvas.width - px_x) * 4;
              break; // check next row
            }
          }
          img_data_counter += 4;
        }
      }
      
      var offset_start = start_px_y - high_guessed_max_height;
      var offset_end = end_px_y - high_guessed_max_height;
      var letter_height = 1 + end_px_y - start_px_y;
      result.max_height = Math.max(result.max_height, letter_height);
      result.lowest_start = Math.min(result.lowest_start, offset_start);
      result.highest_end = Math.max(result.highest_end, offset_end);
      result.measurements[letter] = { start: offset_start, end: offset_end, height: letter_height };
      result.loading_counter--;
      if(result.loading_counter == 0) {
        onloadcallback();
      }
    }, 1);
  }
  var zChCode = 'z'.charCodeAt(0);
  for(var ch = 'a'.charCodeAt(0); ch <= zChCode; ch++) {
    var letter = String.fromCharCode(ch);
    measure_letter(letter);
  }
  
  var ZChCode = 'Z'.charCodeAt(0);
  for(var ch = 'A'.charCodeAt(0); ch <= ZChCode; ch++) {
    var letter = String.fromCharCode(ch);
    measure_letter(letter);
  }
  
  var _9ChCode = '9'.charCodeAt(0);
  for(var ch = '0'.charCodeAt(0); ch <= _9ChCode; ch++) {
    var letter = String.fromCharCode(ch);
    measure_letter(letter);
  }
  
  result.measure_height = function(text) {
    var height = 0;
    var lowest_start = this.highest_end;
    var highest_end = this.lowest_start;
    
    for(var i = 0; i < text.length; i++) {
      var letter = text.charAt(i);
      if(!(letter in this.measurements)) {
        return { start: this.lowest_start, end: this.highest_end, height: this.max_height };
      }
      
      var letter_info = result.measurements[letter];
      lowest_start = Math.min(lowest_start, letter_info.start);
      highest_end = Math.max(highest_end, letter_info.end);
      height = Math.max(height, letter_info.height);
      if(height == this.max_height && lowest_start == this.lowest_start && highest_end == this.highest_end)
        break;
    }
    return { start: lowest_start, end: highest_end, height: height };
  };
  
  return result;
}

// https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas
/**
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last three params, it will draw a rectangle
 * outline with a 5 pixel border radius
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} [radius = 5] The corner radius; It can also be an object 
 *                 to specify different radii for corners
 * @param {Number} [radius.tl = 0] Top left
 * @param {Number} [radius.tr = 0] Top right
 * @param {Number} [radius.br = 0] Bottom right
 * @param {Number} [radius.bl = 0] Bottom left
 * @param {Boolean} [fill = false] Whether to fill the rectangle.
 * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
 */
iorpg.round_rect = function(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke == 'undefined') {
    stroke = true;
  }
  if (typeof radius === 'undefined') {
    radius = 5;
  }
  if (typeof radius === 'number') {
    radius = {tl: radius, tr: radius, br: radius, bl: radius};
  } else {
    var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
    for (var side in defaultRadius) {
      radius[side] = radius[side] || defaultRadius[side];
    }
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) {
    ctx.fill();
  }
  if (stroke) {
    ctx.stroke();
  }
}

iorpg.circle = function(ctx, x, y, radius, fill, stroke)
{
  var centerX = x + radius;
  var centerY = y + radius;
  
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
  ctx.closePath();
  if(fill)
    ctx.fill();
  if(stroke)
    ctx.stroke();
}

// Creates a canvas with the specified text with the specified font metrics and fillStyle
// style
//
// ex.
//   var fontmetrics = iorpg.create_font_metrics("12px Open-Sans", function() {
//     create_text("hello world", fontmetrics, "#FFF");
//   });
//
// notes
//   cache text whenever possible, it's expensive to draw
//   always cache font metrics, they are expensive to generate
//   the game caches font metrics under "iorpg.fonts". ex: iorpg.fonts[iorpg.FONTS.TITLE]
//   the resulting canvas will have an accurate width/height for the text
iorpg.create_text = function(text, font, fillStyle) {
  var canv = document.createElement("canvas");
  var ctx = canv.getContext("2d");
  
  ctx.font = font.font;
  var req_width = ctx.measureText(text).width;
  if(text.length < 25)
    var height_info = font.measure_height(text);
  else
    var height_info = { start: font.lowest_start, end: font.highest_end, height: font.max_height };
  
  canv.width = req_width;
  canv.height = height_info.height;
  ctx.font = font.font;
  ctx.fillStyle = fillStyle;
  ctx.fillText(text, 0, -height_info.start);
  
  return canv;
};

// Creates and returns a canvas with LOADING displayed on it
iorpg.create_loading_text = function() {
  var text = "LOADING";
  var font = this.fonts[this.FONTS.TITLE];
  
  var canv = document.createElement("canvas");
  var ctx = canv.getContext("2d");
  
  ctx.font = font.font;
  var width = ctx.measureText(text).width;
  var height_info = font.measure_height(text);
  
  canv.width = width + 10;
  canv.height = height_info.height + 10;
  
  ctx.fillStyle = "#aaa";
  this.round_rect(ctx, 0.5, 0.5, canv.width - 1, canv.height - 1, 10, true, false);
  
  ctx.fillStyle = "#333";
  ctx.font = font.font;
  ctx.fillText(text, 5, 5 - height_info.start)
  
  return canv;
}

// Creates and returns a canvas with a warrior displayed on it.
iorpg.create_warrior = function() {
  var canv = document.createElement("canvas");
  var ctx = canv.getContext("2d");
  
  canv.width = 96;
  canv.height = 96;
  ctx.fillStyle = "#F33";
  ctx.strokeStyle = "#500";
  ctx.lineWidth = 2;
  this.round_rect(ctx, 1.5, 1.5, canv.width - 3, canv.height - 3, 20, true, true);
  ctx.fillStyle = "#FFF";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(15, 20);
  ctx.lineTo(35, 21)
  ctx.stroke();
  
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(16, 25);
  ctx.lineTo(34, 26);
  //ctx.lineTo(25, 40);
  ctx.bezierCurveTo(34, 41, 16, 40, 16, 25)
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(26, 29, 2, 3, 0, 0, Math.PI * 2, false);
  ctx.fill();
  
  ctx.lineWidth = 3;
  ctx.fillStyle = "#FFF";
  ctx.beginPath();
  ctx.moveTo(55, 22);
  ctx.lineTo(75, 23)
  ctx.stroke();
  
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(56, 27);
  ctx.lineTo(74, 28);
  //ctx.lineTo(25, 40);
  ctx.bezierCurveTo(74, 43, 56, 42, 56, 27)
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(66, 31, 2, 3, 0, 0, Math.PI * 2, false);
  ctx.fill();
  
  ctx.fillStyle = "#000";
  this.round_rect(ctx, 40.5, 70.5, 20, 2, 2, true, false);
  
  return canv;
};

iorpg.create_warrior_sword = function() {
  var canv = document.createElement("canvas");
  var ctx = canv.getContext("2d");
  
  canv.width = 30;
  canv.height = 70;
  
  ctx.strokeStyle = "#F00";
  ctx.fillStyle = "#000";
  ctx.beginPath()
  ctx.moveTo(17.5, 0.5);
  ctx.lineTo(19.5, 50.5);
  ctx.lineTo(0.5, 45.5);
  ctx.lineTo(17.5, 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(8.5, 47.5);
  ctx.lineTo(12.5, 48.5);
  ctx.lineTo(8.5, 69.5);
  ctx.lineTo(4.5, 69.5);
  ctx.lineTo(8.5, 47.5);
  ctx.closePath();
  ctx.fill();
  
  return canv;
}

iorpg.create_hunter = function() {
  var canv = document.createElement("canvas");
  var ctx = canv.getContext("2d");
  
  canv.width = 80;
  canv.height = 80;
  
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#050";
  ctx.fillStyle = "#3F3";
  this.round_rect(ctx, 1.5, 1.5, canv.width - 3, canv.height - 3, 20, true, true);
  
  var eyex = 15.0, eyey = 15.0, eyew = 20.0, eyeh = 30.0, eyer = 12.0;
  ctx.fillStyle = "#282";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(eyex, eyey + eyeh / 2);
  ctx.arcTo(eyex + eyew / 2, eyey, eyex + eyew, eyey + eyeh / 2, eyer) 
  ctx.arcTo(eyex + eyew / 2, eyey + eyeh, eyex, eyey + eyeh / 2, eyer) 
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#aca";
  this.circle(ctx, eyex + eyew / 2 - 5, eyey + eyeh / 2 - 5, 5, true, true);
  ctx.fillStyle = "#000";
  this.circle(ctx, eyex + eyew / 2 - 2, eyey + eyeh / 2 - 2, 2, true, true);
  ctx.fillStyle = "#fff";
  this.circle(ctx, eyex + eyew / 2, eyey + eyeh / 2 - 1, 0.5, true, false);
  
  
  eyex = 45.0;
  ctx.fillStyle = "#282";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(eyex, eyey + eyeh / 2);
  ctx.arcTo(eyex + eyew / 2, eyey, eyex + eyew, eyey + eyeh / 2, eyer) 
  ctx.arcTo(eyex + eyew / 2, eyey + eyeh, eyex, eyey + eyeh / 2, eyer) 
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#aca";
  this.circle(ctx, eyex + eyew / 2 - 5, eyey + eyeh / 2 - 5, 5, true, true);
  ctx.fillStyle = "#000";
  this.circle(ctx, eyex + eyew / 2 - 2, eyey + eyeh / 2 - 2, 2, true, true);
  ctx.fillStyle = "#fff";
  this.circle(ctx, eyex + eyew / 2, eyey + eyeh / 2 - 1, 0.5, true, false);
  
  ctx.fillStyle = "#DFD";
  ctx.beginPath();
  ctx.moveTo(30.5, 52.5);
  ctx.lineTo(51.5, 54.5);
  ctx.stroke();
  
  return canv;
}

iorpg.create_hunter_bow = function() {
  var canv = document.createElement("canvas");
  var ctx = canv.getContext("2d");
  
  canv.width = 20;
  canv.height = 50;
  
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0.5, 0.5);
  ctx.lineTo(0.5, canv.height - 0.5);
  ctx.stroke();

  ctx.strokeStyle = "#000";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0.5, 0.5);
  ctx.arcTo(canv.width - 0.5, canv.height / 2 - 0.5, 0.5, canv.height - 0.5, 40);
  ctx.stroke();
  
  return canv;
}

iorpg.create_priest = function() {
  var canv = document.createElement("canvas");
  var ctx = canv.getContext("2d");
  
  canv.width = 76;
  canv.height = 76;
  
  ctx.lineWidth = 2;
  ctx.fillStyle = "#E8B";
  ctx.strokeStyle = "#826";
  this.round_rect(ctx, 1.5, 1.5, canv.width - 3, canv.height - 3, 18, true, true);
  
  ctx.fillStyle = "#FFF";
  ctx.strokeStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(25, 25, 7, 10, 0, 0, Math.PI * 2, false);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(25.5, 26, 3, 5, 0, 0, Math.PI * 2, false);
  ctx.fill();
  
  ctx.fillStyle = "#FFF";
  ctx.strokeStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(55, 25, 7, 10, 0, 0, Math.PI * 2, false);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(55.5, 26, 3, 5, 0, 0, Math.PI * 2, false);
  ctx.fill();
  
  ctx.beginPath();
  ctx.moveTo(30, 55);
  ctx.arcTo(40, 60, 50, 54, 10);
  ctx.stroke();
  
  
  return canv;
}

iorpg.create_priest_wand = function() {
  var canv = document.createElement("canvas");
  var ctx = canv.getContext("2d");
  
  canv.width = 30;
  canv.height = 40;
  
  ctx.fillStyle = "#D3E";
  ctx.strokeStyle = "#819";
  
  ctx.beginPath();
  ctx.moveTo(10, 10);
  ctx.lineTo(6, 2);
  ctx.lineTo(15, 8);
  ctx.lineTo(24, 1);
  ctx.lineTo(19, 9);
  ctx.lineTo(29, 10);
  ctx.lineTo(17, 13);
  ctx.lineTo(19, 22);
  ctx.lineTo(11, 16);
  ctx.lineTo(1, 15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(12, 16);
  ctx.lineTo(0, 40);
  ctx.stroke();
  
  return canv;
}

iorpg.create_select_warrior_unhovered = function() {
  var hero_name = "WARRIOR";
  var hero_description = [ "Push your enemies" ];
  
  var canv = document.createElement("canvas");
  var ctx = canv.getContext("2d");
  
  var hero_name_font = this.fonts[this.FONTS.SMALL_TITLE];
  var hero_desc_font = this.fonts[this.FONTS.PARAGRAPH];
  var hero_img = this.images[this.IMAGES.WARRIOR];
  var hero_weapon = this.images[this.IMAGES.WARRIOR_SWORD];
  var hero_weapon_offset = { x: hero_img.width + 5, y: 10 };
  
  var title_line_height = hero_name_font.max_height; 
  var description_height = (hero_desc_font.max_height + 3) * hero_description.length;
  
  canv.width = hero_weapon_offset.x + hero_weapon.width;
  canv.height = 96 + 5 + title_line_height + 9 + description_height;
  
  var hero_img_y_padding = (96 - hero_img.height) / 2;
  
  ctx.drawImage(hero_img, 0, hero_img_y_padding);
  ctx.drawImage(hero_weapon, hero_weapon_offset.x, hero_img_y_padding + hero_weapon_offset.y);
  
  ctx.font = hero_name_font.font;
  
  var hero_name_width = ctx.measureText(hero_name).width;
  ctx.fillStyle = "#000";
  ctx.fillText(hero_name, (canv.width - hero_name_width) / 2, 96 + 5 - hero_name_font.lowest_start)
  
  var y = 96 + 5 + title_line_height + 9;
  ctx.font = hero_desc_font.font;
  for(var i = 0; i < hero_description.length; i++) {
    ctx.fillText(hero_description[i], 0, y);
    y += hero_desc_font.max_height + 3;
  }
  return canv;
}

iorpg.create_select_warrior_hovered = function() {
  var canv = document.createElement("canvas");
  var ctx = canv.getContext("2d");
  
  var base_img = iorpg.images[iorpg.IMAGES.SELECT_WARRIOR_STANDARD];
  
  canv.width = base_img.width + 10;
  canv.height = base_img.height + 10;
  
  ctx.fillStyle = "#ddd";
  this.round_rect(ctx, 0, 0, canv.width, canv.height, 20, true, false);
  ctx.drawImage(base_img, 5, 5);
  
  return canv;
}

iorpg.create_select_warrior_pressed = function() {
  var canv = document.createElement("canvas");
  var ctx = canv.getContext("2d");
  
  var base_img = iorpg.images[iorpg.IMAGES.SELECT_WARRIOR_STANDARD];
  
  canv.width = base_img.width + 10;
  canv.height = base_img.height + 10;
  
  ctx.fillStyle = "#888";
  this.round_rect(ctx, 0, 0, canv.width, canv.height, 20, true, false);
  ctx.drawImage(base_img, 5, 5);
  
  return canv
}

iorpg.create_select_hunter_unhovered = function() {
  var hero_name = "HUNTER";
  var hero_description = [ "Hurt your enemies" ];
  
  var canv = document.createElement("canvas");
  var ctx = canv.getContext("2d");
  
  var hero_name_font = this.fonts[this.FONTS.SMALL_TITLE];
  var hero_desc_font = this.fonts[this.FONTS.PARAGRAPH];
  var hero_img = this.images[this.IMAGES.HUNTER];
  var hero_weapon = this.images[this.IMAGES.HUNTER_BOW];
  var hero_weapon_offset = { x: hero_img.width + 5, y: 20 };
  
  var title_line_height = hero_name_font.max_height; 
  var description_height = (hero_desc_font.max_height + 3) * hero_description.length;
  
  canv.width = hero_weapon_offset.x + hero_weapon.width;
  canv.height = 96 + 5 + title_line_height + 9 + description_height;
  
  var hero_img_y_padding = (96 - hero_img.height) / 2;
  
  ctx.drawImage(hero_img, 0, hero_img_y_padding);
  ctx.drawImage(hero_weapon, hero_weapon_offset.x, hero_img_y_padding + hero_weapon_offset.y);
  
  ctx.font = hero_name_font.font;
  
  var hero_name_width = ctx.measureText(hero_name).width;
  ctx.fillStyle = "#000";
  ctx.fillText(hero_name, (canv.width - hero_name_width) / 2, 96 + 5 - hero_name_font.lowest_start)
  
  var y = 96 + 5 + title_line_height + 9;
  ctx.font = hero_desc_font.font;
  for(var i = 0; i < hero_description.length; i++) {
    ctx.fillText(hero_description[i], 0, y);
    y += hero_desc_font.max_height + 3;
  }
  return canv;
}

iorpg.create_select_hunter_hovered = function() {
  var canv = document.createElement("canvas");
  var ctx = canv.getContext("2d");
  
  var base_img = iorpg.images[iorpg.IMAGES.SELECT_HUNTER_STANDARD];
  
  canv.width = base_img.width + 10;
  canv.height = base_img.height + 10;
  
  ctx.fillStyle = "#ddd";
  this.round_rect(ctx, 0, 0, canv.width, canv.height, 20, true, false);
  ctx.drawImage(base_img, 5, 5);
  
  return canv;
}

iorpg.create_select_hunter_pressed = function() {
  var canv = document.createElement("canvas");
  var ctx = canv.getContext("2d");
  
  var base_img = iorpg.images[iorpg.IMAGES.SELECT_HUNTER_STANDARD];
  
  canv.width = base_img.width + 10;
  canv.height = base_img.height + 10;
  
  ctx.fillStyle = "#888";
  this.round_rect(ctx, 0, 0, canv.width, canv.height, 20, true, false);
  ctx.drawImage(base_img, 5, 5);
  
  return canv;
}

iorpg.create_select_priest_unhovered = function() {
  var hero_name = "PRIEST";
  var hero_description = [ "Heal your friends" ];
  
  var canv = document.createElement("canvas");
  var ctx = canv.getContext("2d");
  
  var hero_name_font = this.fonts[this.FONTS.SMALL_TITLE];
  var hero_desc_font = this.fonts[this.FONTS.PARAGRAPH];
  var hero_img = this.images[this.IMAGES.PRIEST];
  var hero_weapon = this.images[this.IMAGES.PRIEST_WAND];
  var hero_weapon_offset = { x: hero_img.width + 5, y: 20 };
  
  var title_line_height = hero_name_font.max_height; 
  var description_height = (hero_desc_font.max_height + 3) * hero_description.length;
  
  canv.width = hero_weapon_offset.x + hero_weapon.width;
  canv.height = 96 + 5 + title_line_height + 9 + description_height;
  
  var hero_img_y_padding = (96 - hero_img.height) / 2;
  
  ctx.drawImage(hero_img, 0, hero_img_y_padding);
  ctx.drawImage(hero_weapon, hero_weapon_offset.x, hero_img_y_padding + hero_weapon_offset.y);
  
  ctx.font = hero_name_font.font;
  
  var hero_name_width = ctx.measureText(hero_name).width;
  ctx.fillStyle = "#000";
  ctx.fillText(hero_name, (canv.width - hero_name_width) / 2, 96 + 5 - hero_name_font.lowest_start)
  
  var y = 96 + 5 + title_line_height + 9;
  ctx.font = hero_desc_font.font;
  for(var i = 0; i < hero_description.length; i++) {
    ctx.fillText(hero_description[i], 0, y);
    y += hero_desc_font.max_height + 3;
  }
  return canv;
}

iorpg.create_select_priest_hovered = function() {
  var canv = document.createElement("canvas");
  var ctx = canv.getContext("2d");
  
  var base_img = iorpg.images[iorpg.IMAGES.SELECT_PRIEST_STANDARD];
  
  canv.width = base_img.width + 10;
  canv.height = base_img.height + 10;
  
  ctx.fillStyle = "#ddd";
  this.round_rect(ctx, 0, 0, canv.width, canv.height, 20, true, false);
  ctx.drawImage(base_img, 5, 5);
    
  return canv;
}

iorpg.create_select_priest_pressed = function() {
  var canv = document.createElement("canvas");
  var ctx = canv.getContext("2d");
  
  var base_img = iorpg.images[iorpg.IMAGES.SELECT_PRIEST_STANDARD];
  
  canv.width = base_img.width + 10;
  canv.height = base_img.height + 10;
  
  ctx.fillStyle = "#888";
  this.round_rect(ctx, 0, 0, canv.width, canv.height, 20, true, false);
  ctx.drawImage(base_img, 5, 5);
  
  return canv;
}

iorpg.create_spell_background = function() {
  var canv = document.createElement("canvas");
  var ctx = canv.getContext("2d");
  
  canv.width = 64;
  canv.height = 64;
  
  ctx.fillStyle = "#888";
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  
  this.round_rect(ctx, 1.5, 1.5, canv.width - 3, canv.height - 3, 5, true, true);
  
  return canv;
};

/*
data: {
  width: number, height: number, image_index_str: string,
  ellipse: { x: number, y: number, width: number, height: number },
  title: { x: number, y: number, text: string },
  description: [ { x: number, y: number, text: string }, ... ],
  v_bottom: { x: number, y: number }, v_0: { x: number, y: number },
  v_1: { x: number, y: number }, 
}
 */
iorpg.__create_spell_hovered_from_data = function(canv, ctx, data) {
  canv.width = data.width;
  canv.height = data.height;
  
  var img_index = this.IMAGES[data.image_index_str];
  var img = this.images[img_index];
  
  ctx.fillStyle = "#ddd";
  ctx.strokeStyle = "#000";
  
  ctx.beginPath();
  ctx.moveTo(data.v_bottom.x, data.v_bottom.y);
  ctx.lineTo(data.v_0.x, data.v_0.y);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(data.v_bottom.x, data.v_bottom.y);
  ctx.lineTo(data.v_1.x, data.v_1.y);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.ellipse(data.ellipse.x, data.ellipse.y, data.ellipse.width, data.ellipse.height, 0, 0, Math.PI * 2, false);
  ctx.fill();
  ctx.stroke();
  
  var _font = this.fonts[this.FONTS.SMALL_TITLE];
  ctx.font = _font.font;
  ctx.fillStyle = "#333";
  ctx.fillText(data.title.text, data.title.x, data.title.y);
  
  _font = this.fonts[this.FONTS.PARAGRAPH];
  ctx.font = _font.font;
  for(var i = 0; i < data.description.length; i++) {
    ctx.fillText(data.description[i].text, data.description[i].x, data.description[i].y);
  }
  
  ctx.drawImage(img, 0, canv.height - 64);
  
  return canv;
};

iorpg.create_spell_hovered_from_data = function(data) {
  var canv = document.createElement("canvas");
  var ctx = canv.getContext("2d");
  
  this.__create_spell_hovered_from_data(canv, ctx, data);
  return canv;
}

iorpg.create_spell_pressed = function(image_index_hovered) {
  var canv = document.createElement("canvas");
  var ctx = canv.getContext("2d");
  var img = this.images[image_index_hovered];
  
  canv.width = img.width;
  canv.height = img.height;
  
  ctx.drawImage(this.images[image_index_hovered], 0, 0);
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = "#000";
  this.round_rect(ctx, 1.5, canv.height - 64 + 1.5, 61, 61, 5, true, false);
  
  return canv;
}

iorpg.create_spell_needs_art = function() {
  var canv = document.createElement("canvas");
  var ctx = canv.getContext("2d");
  
  canv.width = 64;
  canv.height = 64;
  
  ctx.drawImage(this.images[this.IMAGES.SPELL_BACKGROUND], 0, 0);
  
  var font = this.fonts[this.FONTS.PARAGRAPH];
  ctx.font = font.font;
  ctx.fillStyle = "#333";
  ctx.fillText("NEED", 5, 25);
  ctx.fillText("ART", 5, 40);
  
  return canv;
}

iorpg.create_spell_lesser_heal_unhovered = function() {
  var canv = document.createElement("canvas");
  var ctx = canv.getContext("2d");
  
  canv.width = 64;
  canv.height = 64;
  
  ctx.drawImage(this.images[this.IMAGES.SPELL_BACKGROUND], 0, 0);
  
  ctx.fillStyle = "#D72";
  ctx.strokeStyle = "#000";
  
  ctx.beginPath();
  ctx.moveTo(3, 18);
  ctx.lineTo(44, 60);
  ctx.lineTo(58, 45);
  ctx.lineTo(17, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(4, 44);
  ctx.lineTo(45, 3);
  ctx.lineTo(60, 18);
  ctx.lineTo(19, 60);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  ctx.fillStyle = "#e28246";
  ctx.strokeStyle = "#d86822";
  ctx.beginPath();
  ctx.moveTo(17, 32);
  ctx.lineTo(31, 46);
  ctx.lineTo(45, 32);
  ctx.lineTo(31, 18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  return canv;
};

iorpg.create_spell_lesser_heal_hovered = function() { //197x87
  var data = {"width":146,"height":154,"image_index_str":"LESSER_HEAL_STANDARD","ellipse":{"x":73.5,"y":40.5,"width":70,"height":40},"title":{"x":32,"y":25,"text":"LESSER HEAL"},"description":[{"x":14,"y":46,"text":"A fast, moderate heal"},{"x":25,"y":61,"text":"but it's expensive"}],"v_bottom":{"x":38,"y":88},"v_0":{"x":45,"y":76},"v_1":{"x":34,"y":74}};
  return this.create_spell_hovered_from_data(data);
};

iorpg.create_spell_lesser_heal_pressed = function() {
  return this.create_spell_pressed(this.IMAGES.LESSER_HEAL_HOVERED);
};

iorpg.create_spell_push_unhovered = function() {
  var canv = document.createElement("canvas");
  var ctx = canv.getContext("2d");
  
  canv.width = 64;
  canv.height = 64;
  
  ctx.drawImage(this.images[this.IMAGES.SPELL_BACKGROUND], 0, 0);
  
  ctx.fillStyle = "#BFB";
  ctx.strokeStyle = "#000";
  ctx.moveTo(31, 5);
  ctx.lineTo(49, 31);
  ctx.lineTo(38, 31);
  ctx.lineTo(41, 58);
  ctx.lineTo(21, 58);
  ctx.lineTo(24, 31);
  ctx.lineTo(13, 31);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  return canv;
};

iorpg.create_spell_push_hovered = function() {
  var data = {"width":124,"height":147,"image_index_str":"PUSH_STANDARD","ellipse":{"x":67,"y":37,"width":55,"height":35},"title":{"x":50,"y":20,"text":"PUSH"},"description":[{"x":18,"y":40,"text":"Pushes an enemy"},{"x":26,"y":55,"text":"away from you"}],"v_bottom":{"x":50,"y":81},"v_0":{"x":50,"y":70},"v_1":{"x":57,"y":72}};
  return this.create_spell_hovered_from_data(data);
};

iorpg.create_spell_push_pressed = function() {
  return this.create_spell_pressed(this.IMAGES.PUSH_HOVERED);
};

iorpg.draw_shield = function(ctx, x, y, w, h, fillStyle, strokeStyle)
{
  var bottom_smoothness = w * 0.2
  var top_smoothness = h * 0.08;
  var top_offset = h * 0.0625;
  
  ctx.fillStyle = fillStyle;
  ctx.strokeStyle = strokeStyle;
  ctx.moveTo(x, y + top_offset);
  ctx.bezierCurveTo(x, y + top_offset + top_smoothness, x + w / 2, y + top_smoothness, x + w / 2, y);
  ctx.bezierCurveTo(x + w / 2, y + top_smoothness, x + w, y + top_offset + top_smoothness, x + w, y + top_offset);
  ctx.bezierCurveTo(x + w + top_smoothness, y + top_offset, x + w / 2 + bottom_smoothness, y + h, x + w / 2, y + h);
  ctx.bezierCurveTo(x + w / 2 - bottom_smoothness, y + h, x - top_smoothness, y + top_offset, x, y + top_offset);
  ctx.fill();
  ctx.stroke();
};

iorpg.create_spell_block_unhovered = function() {
  var canv = document.createElement("canvas");
  var ctx = canv.getContext("2d");
  
  canv.width = 64;
  canv.height = 64;
  
  ctx.drawImage(this.images[this.IMAGES.SPELL_BACKGROUND], 0, 0);
  this.draw_shield(ctx, 5, 5, 54, 54, "#BBF", "#000");
  
  return canv;
};

iorpg.create_spell_block_hovered = function() {
  var data = {"width":184,"height":157,"image_index_str":"BLOCK_STANDARD","ellipse":{"x":97,"y":42,"width":85,"height":40},"title":{"x":78,"y":20,"text":"BLOCK"},"description":[{"x":20,"y":40,"text":"Reduces the damage taken"},{"x":30,"y":55,"text":"from the next hit by 80%"}],"v_bottom":{"x":50,"y":91},"v_0":{"x":50,"y":70},"v_1":{"x":60,"y":72}};
  return this.create_spell_hovered_from_data(data);
};

iorpg.create_spell_block_pressed = function() {
  return this.create_spell_pressed(this.IMAGES.BLOCK_HOVERED);
};

iorpg.create_modifier_blocked = function() {
  var canv = document.createElement("canvas");
  var ctx = canv.getContext("2d");
  
  canv.width = 96;
  canv.height = 96;
  
  ctx.globalAlpha = 0.7;
  this.draw_shield(ctx, 10, 10, 76, 76, "#BBF", "#000");
  ctx.globalAlpha = 1;
  
  return canv;
};

iorpg.create_spell_shoot_unhovered = function() {
  return this.create_spell_needs_art();
};

iorpg.create_spell_shoot_hovered = function() {
  var data = {"width":184,"height":157,"image_index_str":"SHOOT_STANDARD","ellipse":{"x":97,"y":42,"width":85,"height":40},"title":{"x":78,"y":20,"text":"SHOOT"},"description":[{"x":30,"y":40,"text":"Shoots something for a"},{"x":37,"y":55,"text":"moderate amount of"},{"text":"damage","x":72,"y":70}],"v_bottom":{"x":50,"y":91},"v_0":{"x":50,"y":70},"v_1":{"x":60,"y":72}}
  return this.create_spell_hovered_from_data(data);
};

iorpg.create_spell_shoot_pressed = function() {
  return this.create_spell_pressed(this.IMAGES.SHOOT_HOVERED);
};

iorpg.create_spell_deliberate_shot_unhovered = function() {
  return this.create_spell_needs_art();
};

iorpg.create_spell_deliberate_shot_hovered = function() {
  var data = {"width":214,"height":157,"image_index_str":"DELIBERATE_SHOT_STANDARD","ellipse":{"x":112,"y":42,"width":100,"height":40},"title":{"x":57,"y":22,"text":"DELIBERATE SHOT"},"description":[{"x":26,"y":43,"text":"Carefully aim your shot to deal"},{"x":29,"y":58,"text":"a massive amount of damage"}],"v_bottom":{"x":50,"y":91},"v_0":{"x":50,"y":70},"v_1":{"x":60,"y":72}}
  return this.create_spell_hovered_from_data(data);
};

iorpg.create_spell_deliberate_shot_pressed = function() {
  return this.create_spell_pressed(this.IMAGES.DELIBERATE_SHOT_HOVERED);
};

iorpg.load_images = function() {
  function start_load_font(fonts_index, font, high_guessed_max_height, callback) {
    var tmp = iorpg.create_font_metrics(font, high_guessed_max_height, function() {
      iorpg.fonts[fonts_index] = tmp;
      callback != null && callback();
    });
  };
  
  function start_load_image(images_index, canvas_gen_func, callback) {
    var tmp = iorpg.canvas_to_image(canvas_gen_func.apply(iorpg, []), function() {
      iorpg.images[images_index] = tmp;
      callback != null && callback();
    });
  };
  
  function call_after_loaded(images_indexes, fonts_indexes, callback) {
    var check_if_loaded = function() {
      for(var i = 0; i < images_indexes.length; i++) {
        if(!(images_indexes[i] in iorpg.images))
        {
          setTimeout(check_if_loaded, 5);
          return;
        }
      }
      
      for(var i = 0; i < fonts_indexes.length; i++) {
        if(!(fonts_indexes[i] in iorpg.fonts)) {
          setTimeout(check_if_loaded, 5);
          return;
        }
      }
      
      callback();
    };
  
    check_if_loaded();
  };
  
  function load_simple_spell(spell_name) {
    var upper = spell_name.toUpperCase();
    var lower = spell_name.toLowerCase();
    
    start_load_image(iorpg.IMAGES[upper + "_STANDARD"], iorpg["create_spell_" + lower + "_unhovered"], function() {
      iorpg.resource_loading_counter += 1;
      
      start_load_image(iorpg.IMAGES[upper + "_HOVERED"], iorpg["create_spell_" + lower + "_hovered"], function() {
        iorpg.resource_loading_counter += 1;
        start_load_image(iorpg.IMAGES[upper + "_PRESSED"], iorpg["create_spell_" + lower + "_pressed"], decrement_counter_fn);
        decrement_counter_fn();
      });
      decrement_counter_fn();
    });
  }
  
  // Make sure this doesn't hit 0 until after everything is loaded
  iorpg.resource_loading_counter = 12;
  var decrement_counter_fn = function() {
    iorpg.resource_loading_counter--;
  };
  
  start_load_font(iorpg.FONTS.TITLE, "64px Russo One", 50, function() {
    start_load_image(iorpg.IMAGES.LOADING, iorpg.create_loading_text, function() {
      iorpg.position_loading();
      decrement_counter_fn();
    });
  });
  
  start_load_image(iorpg.IMAGES.WARRIOR, iorpg.create_warrior, decrement_counter_fn);
  start_load_image(iorpg.IMAGES.WARRIOR_SWORD, iorpg.create_warrior_sword, decrement_counter_fn);
  start_load_image(iorpg.IMAGES.HUNTER, iorpg.create_hunter, decrement_counter_fn);
  start_load_image(iorpg.IMAGES.HUNTER_BOW, iorpg.create_hunter_bow, decrement_counter_fn);
  start_load_image(iorpg.IMAGES.PRIEST, iorpg.create_priest, decrement_counter_fn);
  start_load_image(iorpg.IMAGES.PRIEST_WAND, iorpg.create_priest_wand, decrement_counter_fn);
  
  start_load_font(iorpg.FONTS.SMALL_TITLE, "12px Russo One", 15, decrement_counter_fn);
  start_load_font(iorpg.FONTS.PARAGRAPH, "12px Open Sans", 15, decrement_counter_fn);
  call_after_loaded([ iorpg.IMAGES.WARRIOR, iorpg.IMAGES.WARRIOR_SWORD ], [ iorpg.FONTS.SMALL_TITLE, iorpg.FONTS.PARAGRAPH ], function() {
    iorpg.resource_loading_counter += 5;
    
    start_load_image(iorpg.IMAGES.SELECT_WARRIOR_STANDARD, iorpg.create_select_warrior_unhovered, function() {
      iorpg.resource_loading_counter += 2;
      
      start_load_image(iorpg.IMAGES.SELECT_WARRIOR_HOVERED, iorpg.create_select_warrior_hovered, decrement_counter_fn);
      start_load_image(iorpg.IMAGES.SELECT_WARRIOR_PRESSED, iorpg.create_select_warrior_pressed, decrement_counter_fn);
      
      decrement_counter_fn();
    });
    
    start_load_image(iorpg.IMAGES.SELECT_HUNTER_STANDARD, iorpg.create_select_hunter_unhovered, function() {
      iorpg.resource_loading_counter += 2;
      
      start_load_image(iorpg.IMAGES.SELECT_HUNTER_HOVERED, iorpg.create_select_hunter_hovered, decrement_counter_fn);
      start_load_image(iorpg.IMAGES.SELECT_HUNTER_PRESSED, iorpg.create_select_hunter_pressed, decrement_counter_fn);
      
      decrement_counter_fn();
    });
    
    start_load_image(iorpg.IMAGES.SELECT_PRIEST_STANDARD, iorpg.create_select_priest_unhovered, function() {
      iorpg.resource_loading_counter += 2;
      
      start_load_image(iorpg.IMAGES.SELECT_PRIEST_HOVERED, iorpg.create_select_priest_hovered, decrement_counter_fn);
      start_load_image(iorpg.IMAGES.SELECT_PRIEST_PRESSED, iorpg.create_select_priest_pressed, decrement_counter_fn);
      
      decrement_counter_fn();
    });
    
    start_load_image(iorpg.IMAGES.SPELL_BACKGROUND, iorpg.create_spell_background, function() {
      iorpg.resource_loading_counter += 4;
      
      load_simple_spell("lesser_heal");
      load_simple_spell("push");
      load_simple_spell("block");
      load_simple_spell("shoot");
      load_simple_spell("deliberate_shot");
      
      decrement_counter_fn();
    });
    
    start_load_image(iorpg.IMAGES.FULL_HEALTH_BAR, iorpg.create_full_health_bar, decrement_counter_fn);
    start_load_image(iorpg.IMAGES.FULL_MANA_BAR, iorpg.create_full_mana_bar, decrement_counter_fn);
    
    decrement_counter_fn();
  });
  
  start_load_image(iorpg.IMAGES.MODIFIER_BLOCKED, iorpg.create_modifier_blocked, decrement_counter_fn);
};

iorpg.resize_canvas = function() {
  var desired_width = window.innerWidth;
  var desired_height = window.innerHeight;
  
  if(this.canvas.width != desired_width) {
    this.canvas.width = desired_width;
  }
  if(this.canvas.height != desired_height) {
    this.canvas.height = desired_height;
  }
  
  this.position_current();
};

iorpg.position_current = function() {
  switch(this.game_state) {
    case this.GAME_STATES.LOADING:
      this.position_loading();
      break;
    case this.GAME_STATES.LOADING_TRANSITION:
      this.position_loading_transition();
      break;
    case this.GAME_STATES.SELECT_HERO:
      this.position_hero_select();
      break;
    case this.GAME_STATES.PLAYING:
      this.position_playing();
      break;
  }
};

iorpg.position_loading = function() {
  if(!(this.IMAGES.LOADING in this.images))
    return;
  
  var img = this.images[this.IMAGES.LOADING];
  this.loading_ui_info.width = img.width;
  this.loading_ui_info.height = img.height;
  this.loading_ui_info.translate.x = this.canvas.width / 2 - this.loading_ui_info.width / 2;
  this.loading_ui_info.translate.y = this.canvas.height / 2 - this.loading_ui_info.height / 2;
};

iorpg.position_loading_transition = function() {
  this.position_loading();
  
  this.loading_transition_ui_info.destination_y = -this.loading_ui_info.height;
};

iorpg.position_hero_select = function() {
  var warrImg = this.images[this.IMAGES.SELECT_WARRIOR_HOVERED];
  var huntImg = this.images[this.IMAGES.SELECT_HUNTER_HOVERED];
  var priestImg = this.images[this.IMAGES.SELECT_PRIEST_HOVERED];
  
  var total_width = warrImg.width + 20 + huntImg.width + 20 + priestImg.width;
  var total_height = Math.max(warrImg.height, huntImg.height, priestImg.height);
  
  var x = this.canvas.width / 2 - total_width / 2;
  var y = this.canvas.height / 2 - total_height / 2;
  
  this.select_hero_ui_info.warrior.width = warrImg.width;
  this.select_hero_ui_info.warrior.height = warrImg.height;
  this.select_hero_ui_info.warrior.translate.x = x;
  this.select_hero_ui_info.warrior.translate.y = y;
  this.select_hero_ui_info.warrior.hovered = this.image_contains(this.select_hero_ui_info.warrior, this.select_hero_ui_info.warrior.translate.x, this.select_hero_ui_info.warrior.translate.y, this.mouse_pos.x, this.mouse_pos.y);
  x += warrImg.width + 20;
  
  this.select_hero_ui_info.hunter.width = huntImg.width;
  this.select_hero_ui_info.hunter.height = huntImg.height;
  this.select_hero_ui_info.hunter.translate.x = x;
  this.select_hero_ui_info.hunter.translate.y = y;
  this.select_hero_ui_info.hunter.hovered = this.image_contains(this.select_hero_ui_info.hunter, this.select_hero_ui_info.hunter.translate.x, this.select_hero_ui_info.hunter.translate.y, this.mouse_pos.x, this.mouse_pos.y);
  
  x += huntImg.width + 20;
  
  this.select_hero_ui_info.priest.width = priestImg.width;
  this.select_hero_ui_info.priest.height = priestImg.height;
  this.select_hero_ui_info.priest.translate.x = x;
  this.select_hero_ui_info.priest.translate.y = y;
  this.select_hero_ui_info.priest.hovered = this.image_contains(this.select_hero_ui_info.priest, this.select_hero_ui_info.priest.translate.x, this.select_hero_ui_info.priest.translate.y, this.mouse_pos.x, this.mouse_pos.y);
};

iorpg.position_playing = function() {
  var spell_top_y = this.canvas.height - 128;
  
  var spacing_between_spells = 5;
  var spell_total_width = this.playing_ui_info.spells.length * (64 + spacing_between_spells);
  
  var x = this.canvas.width / 2 - spell_total_width / 2;
  
  for(var i = 0; i < this.playing_ui_info.spells.length; i++) {
    var spl = this.playing_ui_info.spells[i];
    
    spl.translate.x = x;
    spl.translate.y = spell_top_y;
    
    x += 64 + spacing_between_spells;
  }
  
  var worldAspectRatio = this.world.width / this.world.height;
  var desiredWidth = 200;
  var height = desiredWidth / worldAspectRatio;
  
  this.minimap.translate.x = this.canvas.width - desiredWidth - 16;
  this.minimap.translate.y = this.canvas.height - height - 16;
  this.minimap.width = desiredWidth;
  this.minimap.height = height;
};

// this updates hover information but does not process clicks
iorpg.handle_mouse_state = function() {
  switch(this.game_state) {
    case this.GAME_STATES.LOADING:
      this.handle_mouse_state_loading();
      break;
    case this.GAME_STATES.LOADING_TRANSITION:
      this.handle_mouse_state_loading_transition();
      break;
    case this.GAME_STATES.SELECT_HERO:
      this.handle_mouse_state_select_hero();
      break;
    case this.GAME_STATES.PLAYING:
      this.handle_mouse_state_playing();
      break;
  }
};

iorpg.handle_mouse_state_loading = function() {
  
};

iorpg.handle_mouse_state_loading_transition = function() {
  
};

iorpg.handle_mouse_state_select_hero = function() {
  this.select_hero_ui_info.warrior.hovered = this.image_contains(this.select_hero_ui_info.warrior, this.select_hero_ui_info.warrior.translate.x, this.select_hero_ui_info.warrior.translate.y, this.mouse_pos.x, this.mouse_pos.y);
  this.select_hero_ui_info.hunter.hovered = this.image_contains(this.select_hero_ui_info.hunter, this.select_hero_ui_info.hunter.translate.x, this.select_hero_ui_info.hunter.translate.y, this.mouse_pos.x, this.mouse_pos.y);
  this.select_hero_ui_info.priest.hovered = this.image_contains(this.select_hero_ui_info.priest, this.select_hero_ui_info.priest.translate.x, this.select_hero_ui_info.priest.translate.y, this.mouse_pos.x, this.mouse_pos.y);
}

iorpg.handle_mouse_state_playing = function() {
  for(var i = 0; i < this.playing_ui_info.spells.length; i++) {
    var spl = this.playing_ui_info.spells[i];
    
    spl.handle_mouse_state();
  }
};

iorpg.handle_mouse_released = function() {
  switch(this.game_state) {
    case this.GAME_STATES.LOADING:
      this.handle_mouse_released_loading();
      break;
    case this.GAME_STATES.LOADING_TRANSITION:
      this.handle_mouse_released_loading_transition();
      break;
    case this.GAME_STATES.SELECT_HERO:
      this.handle_mouse_released_select_hero();
      break;
    case this.GAME_STATES.PLAYING:
      this.handle_mouse_released_playing();
      break;
  }
};

iorpg.handle_mouse_released_loading = function() {};
iorpg.handle_mouse_released_loading_transition = function() {};

iorpg.handle_mouse_released_select_hero = function() {
  if(this.select_hero_ui_info.warrior.hovered) {
    this.begin_play_game(this.HEROES.WARRIOR);
  }else if(this.select_hero_ui_info.hunter.hovered) {
    this.begin_play_game(this.HEROES.HUNTER);
  }else if(this.select_hero_ui_info.priest.hovered) {
    this.begin_play_game(this.HEROES.PRIEST);
  }
};

iorpg.handle_mouse_released_playing = function() {};

iorpg.init_spells_from_hero = function(hero) {
  function create_from_image_index(index_stnd, index_hov, index_pres, radius, handle_mouse_state_fn) {
    var img_stnd = iorpg.images[index_stnd];
    var img_hov = iorpg.images[index_hov];
    var img_pres = iorpg.images[index_pres];
    
    return { 
        translate: { x: 0, y: 0 }, 
        radius: radius,
        icon_standard: { 
          img: img_stnd,
          translate: { x: 0, y : 0 } 
        }, 
        icon_hovered: { 
          img: img_hov,
          translate: { x: 0, y: 64 - img_hov.height }
        },
        icon_pressed: {
          img: img_pres,
          translate: { x: 0, y: 64 - img_pres.height }
        },
        hovered: false,
        handle_mouse_state: function() {
          this.hovered = iorpg.image_contains(this.icon_standard.img, this.translate.x + this.icon_standard.translate.x, this.translate.y + this.icon_standard.translate.y, iorpg.mouse_pos.x, iorpg.mouse_pos.y);
          
          handle_mouse_state_fn.apply(this, arguments);
        }
    };
  };
  
  function create_targeted_spell_fn(index) {
    return function() {
      if(this.hovered && iorpg.mouse_left_down) {
        this.trying_to_use = true;
      }else if(iorpg.mouse_left_down && this.trying_to_use) {
        this.trying_to_use = false;
        
        var target_x = iorpg.mouse_pos.x + iorpg.camera.translate.x;
        var target_y = iorpg.mouse_pos.y + iorpg.camera.translate.y;
        
        iorpg.socket.send(JSON.stringify([ iorpg.SOCKET_MESSAGE_TYPES.CAST_SPELL, index, { x: target_x, y: target_y }]));
      }
    };
  }
  
  function create_untargeted_spell_fn(index) {
    return function() {
      if(this.hovered && iorpg.mouse_left_down) {
        iorpg.socket.send(JSON.stringify([ iorpg.SOCKET_MESSAGE_TYPES.CAST_SPELL, index ]));
      }
    }
  }
  var result = [];
  switch(hero) {
    case this.HEROES.WARRIOR:
      result.push(create_from_image_index(this.IMAGES.PUSH_STANDARD, this.IMAGES.PUSH_HOVERED, this.IMAGES.PUSH_PRESSED, 200, create_targeted_spell_fn(0)));
      result.push(create_from_image_index(this.IMAGES.BLOCK_STANDARD, this.IMAGES.BLOCK_HOVERED, this.IMAGES.BLOCK_PRESSED, 0, create_untargeted_spell_fn(1)));
      break;
    case this.HEROES.HUNTER:
      result.push(create_from_image_index(this.IMAGES.SHOOT_STANDARD, this.IMAGES.SHOOT_HOVERED, this.IMAGES.SHOOT_PRESSED, 300, create_targeted_spell_fn(0)));
      result.push(create_from_image_index(this.IMAGES.DELIBERATE_SHOT_STANDARD, this.IMAGES.DELIBERATE_SHOT_HOVERED, this.IMAGES.DELIBERATE_SHOT_PRESSED, 400, create_targeted_spell_fn(1)));
      break;
    case this.HEROES.PRIEST:
      result.push(create_from_image_index(this.IMAGES.LESSER_HEAL_STANDARD, this.IMAGES.LESSER_HEAL_HOVERED, this.IMAGES.LESSER_HEAL_PRESSED, 300, create_targeted_spell_fn(0)));
      break;
  }
  return result;
};

iorpg.begin_play_game = function(hero) {
  swal({
    title: "An input!",
    text: "What should your display name be?",
    type: "input",
    showCancelButton: true,
    closeOnConfirm: true,
    animation: "slide-from-top",
    inputPlaceholder: "Your name"
  },
  function(inputValue){
    if (inputValue === false) return false;
    
    if (inputValue === "") {
      var nm = "unnamed#" + Math.floor(Math.random() * 1000);
    }else {
      var nm = inputValue;
    }
    
    iorpg.do_begin_play_game(hero, nm);
  });
};

iorpg.do_begin_play_game = function(hero, name) {
  this.world.me.hero = hero;
  this.world.me.name = name;
  this.playing_ui_info.spells = this.init_spells_from_hero(hero);
  this.socket = new WebSocket("ws://73.221.43.61:8081/Play")
  this.socket.onopen = function() {
    iorpg.socket_onopen.apply(iorpg, arguments);
  };
  this.socket.onmessage = function() {
    iorpg.socket_onmessage.apply(iorpg, arguments);
  };
  this.socket.onerror = function() {
    iorpg.socket_onerror.apply(iorpg, arguments);
  };
  this.socket.onclose = function() {
    iorpg.socket_onclose.apply(iorpg, arguments);
  }
  
  this.change_game_state(this.GAME_STATES.PLAYING);
}
iorpg.socket_onopen = function(ev) {
  console.log("socket_onopen");
  
  this.socket.send(JSON.stringify([this.SOCKET_MESSAGE_TYPES.HELLO, { hero: this.world.me.hero, name: this.world.me.name }]));
};

iorpg.socket_onmessage = function(ev) {
  var parsed = JSON.parse(ev.data);
  
  var msgType = parsed[0];
  var msgData = parsed[1];
  
  switch(msgType) {
    case this.SOCKET_MESSAGE_TYPES.TICK:
      this.handle_world_update(msgData);
      break;
  }
};

iorpg.socket_onerror = function(ev) {
  console.log("socket_onerror");
};

iorpg.socket_onclose = function(ev) {
  console.log("socket_onclose");
  this.game_state = this.GAME_STATES.SELECT_HERO;
}

iorpg.handle_key_up = function(ev) {
  if(this.game_state != this.GAME_STATES.PLAYING)
    return;
  
  var code = ev.keyCode;
  
  switch(code) {
    case 65: // A
      this.socket.send(JSON.stringify([this.SOCKET_MESSAGE_TYPES.STOP_MOVE, this.DIRECTIONS.LEFT]));
      break;
    case 87: // W
      this.socket.send(JSON.stringify([this.SOCKET_MESSAGE_TYPES.STOP_MOVE, this.DIRECTIONS.UP]));
      break;
    case 68: // D
      this.socket.send(JSON.stringify([this.SOCKET_MESSAGE_TYPES.STOP_MOVE, this.DIRECTIONS.RIGHT]));
      break;
    case 83: // S
      this.socket.send(JSON.stringify([this.SOCKET_MESSAGE_TYPES.STOP_MOVE, this.DIRECTIONS.DOWN]));
      break;
  }
};

iorpg.handle_key_down = function(ev) {
  if(this.game_state != this.GAME_STATES.PLAYING)
    return;
  
  var code = ev.keyCode;
  
  switch(code) {
    case 65: // A
      this.socket.send(JSON.stringify([this.SOCKET_MESSAGE_TYPES.START_MOVE, this.DIRECTIONS.LEFT]));
      break;
    case 87: // W
      this.socket.send(JSON.stringify([this.SOCKET_MESSAGE_TYPES.START_MOVE, this.DIRECTIONS.UP]));
      break;
    case 68: // D
      this.socket.send(JSON.stringify([this.SOCKET_MESSAGE_TYPES.START_MOVE, this.DIRECTIONS.RIGHT]));
      break;
    case 83: // S
      this.socket.send(JSON.stringify([this.SOCKET_MESSAGE_TYPES.START_MOVE, this.DIRECTIONS.DOWN]));
      break;
  }
};

iorpg.handle_world_update = function(new_world) {
  new_world.ids_to_indexes = {}
  for(var i = 0; i < new_world.entities.length; i++) {
    var id = new_world.entities[i].id;
    new_world.ids_to_indexes[id] = i;
  }
  
  var tmp = this.new_world;
  this.new_world = new_world;
  if(!tmp.empty) {
    this.world = tmp;
    if(this.interpolated_timestamp != this.world.timestamp) {
      this.interpolated_timestamp = this.world.timestamp;
    }
    
    if(this.new_world.minimap_markers) {
      this.minimap.dirty = true;
    }else {
      this.new_world.minimap_markers = this.world.minimap_markers;
    }
  }else
  {
    new_world.minimap_markers = new_world.minimap_markers || [];
    this.interpolated_timestamp = new_world.timestamp;
    this.world = new_world;
    this.minimap.dirty = true;
    this.position_current();
  }
};

iorpg.image_contains = function(img, img_x, img_y, check_x, check_y) {
  return check_x >= img_x && check_y >= img_y && check_x <= img_x + img.width && check_y <= img_y + img.height;  
};

iorpg.change_game_state = function(new_state) {
  this.game_state = new_state;
  this.position_current();
  this.handle_mouse_state();
}

iorpg.update_camera = function() {
  var me = this.world.me;
  var my_interp_pos = me.translate;
  
  var progress = (this.interpolated_timestamp - this.world.timestamp) / (this.new_world.timestamp - this.world.timestamp);
  if(this.new_world.timestamp != this.world.timestamp)
  {
    var newMe = this.new_world.me;
    my_interp_pos = { x: me.translate.x + (newMe.translate.x - me.translate.x) * progress, y: me.translate.y + (newMe.translate.y - me.translate.y) * progress };
  }else {
    var progress = 0;
  }
  
  var myWidth = 0;
  var myHeight = 0;
  switch(this.new_world.me.hero) {
    case this.HEROES.WARRIOR:
      myWidth = this.images[this.IMAGES.WARRIOR].width;
      myHeight = this.images[this.IMAGES.WARRIOR].height;
      break;
    case this.HEROES.HUNTER:
      myWidth = this.images[this.IMAGES.HUNTER].width;
      myHeight = this.images[this.IMAGES.HUNTER].height;
      break;
    case this.HEROES.PRIEST:
      myWidth = this.images[this.IMAGES.PRIEST].width;
      myHeight = this.images[this.IMAGES.PRIEST].height;
      break;
  }
  this.camera.translate = { x: my_interp_pos.x - this.canvas.width / 2 + myWidth / 2, y: my_interp_pos.y - this.canvas.height / 2 + myHeight / 2};
}

iorpg.draw_health_bar = function(ctx, left_x, top_y, max_width, max_height, health, fill_style, stroke_style) 
{
  if(health > 100)
    console.log("weird health: " + health);
  var health_perc = health / 100.0;
  var width = max_width * health_perc;

  ctx.fillStyle = fill_style;
  ctx.strokeStyle = stroke_style;
  ctx.lineWidth = 2;

  if(health > 0) {
    ctx.beginPath();
    ctx.moveTo(left_x + 1, top_y + 1);
    ctx.lineTo(left_x + width - 2, top_y + 1);
    ctx.lineTo(left_x + width - 2, top_y + max_height - 2);
    ctx.lineTo(left_x + 1, top_y + max_height - 2);
    ctx.closePath();
    ctx.fill();
  }

  ctx.beginPath();
  ctx.moveTo(left_x + 1, top_y + 1);
  ctx.lineTo(left_x + max_width - 2, top_y + 1);
  ctx.lineTo(left_x + max_width - 2, top_y + max_height - 2);
  ctx.lineTo(left_x + 1, top_y + max_height - 2);
  ctx.closePath();
  ctx.stroke();
};

iorpg.create_full_health_bar = function() {
  var canv = document.createElement("canvas");
  var ctx = canv.getContext("2d");
  
  canv.width = 100;
  canv.height = 20;
  
  this.draw_health_bar(ctx, 0.5, 0.5, 99, 19, 100, "#C24", "#800");
  
  return canv;
}

iorpg.create_full_mana_bar = function() {
  var canv = document.createElement("canvas");
  var ctx = canv.getContext("2d");
  
  canv.width = 100;
  canv.height = 20;
  
  this.draw_health_bar(ctx, 0.5, 0.5, 99, 19, 100, "#42C", "#008");
  
  return canv;
}

iorpg.create_cachable_text = function(text, font_index, timestamp, inprogress_index, repl_index) {
    var _canv = document.createElement("canvas");
    var _ctx = _canv.getContext("2d")
    var _font = this.fonts[font_index];
    
    _ctx.font = _font.font;
    var wid = _ctx.measureText(text).width;
    if(text.length < 20)
      var _font_metr = _font.measure_height(text);
    else
      var _font_metr = { start: _font.lowest_start, end: _font.highest_end, height: _font.max_height };
    
    _canv.width = wid;
    _canv.height = _font_metr.height;
    
    _ctx.font = _font.font;
    _ctx.fillStyle = "#333";
    _ctx.fillText(text, 0, -_font_metr.start);
    
    var asimg = this.canvas_to_image(_canv, function() {
      if(!repl_index)
        iorpg.text_cache.push({ text: text, font_index: font_index, last_used: timestamp, img: asimg })
      else
        iorpg.text_cache[repl_index] = { text: text, font_index: font_index, last_used: timestamp, img: asimg };
      
      iorpg.text_cache_inprogress.splice(inprogress_index, 1);
    });
    
    return { width: _canv.width, metrics: _font_metr };
};
iorpg.draw_cachable_text = function(ctx, text, x, y, font_index, center_x) {
  center_x = !!center_x;
  var curr_timestamp = this.world && this.world.timestamp || 0;
  
  var oldest_index = -1;
  var oldest_timestamp = -1;
  for(var i = 0; i < this.text_cache.length; i++) {
    var cache = this.text_cache[i];
    
    if(cache.font_index == font_index && cache.text == text) {
      ctx.drawImage(cache.img, x - (center_x ? cache.img.width / 2 : 0), y);
      cache.last_used = curr_timestamp;
      return;
    }
    
    if(oldest_index == -1 || cache.last_used < oldest_timestamp) {
      oldest_index = i;
      oldest_timestamp = cache.last_used;
    }
  }
  
  var is_loading = false;
  for(var i = 0; i < this.text_cache_inprogress.length; i++) {
    var cache = this.text_cache_inprogress[i];
    
    if(cache.text == text && cache.font_index == font_index) {
      is_loading = true;
      break;
    }
  }
  
  ctx.fillStyle = "#333";
  ctx.font = this.fonts[font_index].font;
  
  if(!is_loading) {
    var ind = this.text_cache_inprogress.length;
    this.text_cache_inprogress[ind] = { text: text, font_index: font_index };
    if(this.text_cache.length < 10 || (curr_timestamp - oldest_timestamp) < 10000) {
      var size = this.create_cachable_text(text, font_index, curr_timestamp, ind);
    }else {
      this.text_cache[oldest_index].last_used = curr_timestamp; // prevent overwriting it before the cached text loads
      var size = this.create_cachable_text(text, font_index, curr_timestamp, ind, oldest_index);
    }
  }else {
    var _font = thsi.fonts[font_index];
    if(text.length < 20) 
      var metr = _font.measure_height(text);
    else
      var metr = { start: _font.lowest_start, end: _font.highest_end, height: _font.max_height };
    var size = { width: ctx.measureText(text).width, metrics: metr };
  }
  
  // that text might take some time to load, until then we just have to wait
  ctx.fillStyle = "#333";
  ctx.fillText(text, x - (center_x ? size.width / 2 : 0), y - size.metrics.start);
};

iorpg.draw_entities = function(phase_num) {
  var health_colors = [ "#C24", "#B13" ];
  var mana_colors = [ "#42C", "#008" ];
  var spell_colors = [ "#AA2", "#881" ];
  var name_color = "#333";
  
  var progress = (this.interpolated_timestamp - this.world.timestamp) / (this.new_world.timestamp - this.world.timestamp);
  
  for(var i = 0; i < this.world.entities.length; i++) {
    var e = this.world.entities[i];
    var newE;
    var pos = e.translate;
    if(e.id in this.new_world.ids_to_indexes) {
      newE = this.new_world.entities[this.new_world.ids_to_indexes[e.id]];
      
      if(this.new_world.timestamp != this.world.timestamp)
      {
        pos = { x: e.translate.x + (newE.translate.x - e.translate.x) * progress, y: e.translate.y + (newE.translate.y - e.translate.y) * progress };
      }
    }
    var screen_x = this.camera.screen_x(pos.x);
    var screen_y = this.camera.screen_y(pos.y);
    var hero_image;
    var weapon_image;
    var weapon_offset_x;
    var weapon_offset_y;
    switch(e.hero) {
      case this.HEROES.WARRIOR:
        hero_image = this.images[this.IMAGES.WARRIOR];
        weapon_image = this.images[this.IMAGES.WARRIOR_SWORD];
        weapon_offset_x = 100;
        weapon_offset_y = 0;
        
        break;
      case this.HEROES.HUNTER:
        hero_image = this.images[this.IMAGES.HUNTER];
        weapon_image = this.images[this.IMAGES.HUNTER_BOW];
        weapon_offset_x = 85;
        weapon_offset_y = 20;
        break;
      case this.HEROES.PRIEST:
        hero_image = this.images[this.IMAGES.PRIEST];
        weapon_image = this.images[this.IMAGES.PRIEST_WAND];
        weapon_offset_x = 80;
        weapon_offset_y = 20;
        break;
    }
    
    if(phase_num == 1) {
      this.ctx.drawImage(hero_image, screen_x, screen_y);
      this.ctx.drawImage(weapon_image, screen_x + weapon_offset_x, screen_y + weapon_offset_y);
      
      var old_blocked = false;
      var new_blocked = false;
      
      if(e.modifiers) {
        old_blocked = e.modifiers.filter(function(m) { return !!m.blocked; })[0];
      }
      if(newE && newE.modifiers) {
        new_blocked = newE.modifiers.filter(function(m) { return !!m.blocked; })[0];
      }
      
      if(old_blocked && new_blocked) { 
        this.ctx.drawImage(this.images[this.IMAGES.MODIFIER_BLOCKED], screen_x, screen_y);
      }else if(!old_blocked && new_blocked) {
        this.ctx.globalAlpha = progress;
        this.ctx.drawImage(this.images[this.IMAGES.MODIFIER_BLOCKED], screen_x, screen_y);
        this.ctx.globalAlpha = 1;
      }else if(old_blocked && !new_blocked) {
        this.ctx.globalAlpha = (1 - progress);
        this.ctx.drawImage(this.images[this.IMAGES.MODIFIER_BLOCKED], screen_x, screen_y);
        this.ctx.globalAlpha = 1;
      }
    }else {
      var bar_x = screen_x + hero_image.width / 2 - 50;
      if(e.health == 100 && (!newE || newE.health == 100)) {
        this.ctx.drawImage(this.images[this.IMAGES.FULL_HEALTH_BAR], bar_x, screen_y - 55);
      }else {
        var curr_health = e.health;
        var new_health = (newE && newE.health) || curr_health
        var visible_health = curr_health + (new_health - curr_health) * progress
        this.draw_health_bar(this.ctx, bar_x, screen_y - 55, 100, 20, visible_health, health_colors[0], health_colors[1]);
      }
      
      if(e.mana == 100 && (!newE || newE.mana == 100)) {
        this.ctx.drawImage(this.images[this.IMAGES.FULL_MANA_BAR], bar_x, screen_y - 30);
      }else {
        var curr_mana = e.mana;
        var new_mana = (newE && newE.mana) || curr_mana;
        var visible_mana = curr_mana + (new_mana - curr_mana) * progress;
        this.draw_health_bar(this.ctx, bar_x, screen_y - 30, 100, 20, visible_mana, mana_colors[0], mana_colors[1]);
      }
      
      if(e.spell_progress) {
        var curr_progress = e.spell_progress;
        var new_progress = (newE && newE.spell_progress) || 100;
        var visible_progress = curr_progress + (new_progress - curr_progress) * progress;
        
        this.draw_health_bar(this.ctx, bar_x, screen_y - 80, 100, 20, visible_progress, spell_colors[0], spell_colors[1]);
      }
      
      if(e.name) {
        this.draw_cachable_text(this.ctx, e.name, bar_x + 50, screen_y - 95, this.FONTS.PARAGRAPH, true);
      }
      
      if(e.id == this.world.me.id)
        var txt = "YOU";
      else if(e.team == this.world.me.team)
        var txt = "FRIEND";
      else
        var txt = "ENEMY";
      
      this.draw_cachable_text(this.ctx, txt, bar_x + 50, screen_y - 110, this.FONTS.SMALL_TITLE, true);
    }
  }
};

iorpg.clean_minimap = function() {
  var canv = document.createElement("canvas");
  var ctx = canv.getContext("2d");
  
  canv.width = this.minimap.width + 6;
  canv.height = this.minimap.height + 6;
  
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#000";
  ctx.fillStyle = "#eee";
  ctx.beginPath();
  ctx.moveTo(2, 2);
  ctx.lineTo(this.minimap.width + 4, 2);
  ctx.lineTo(this.minimap.width + 4, this.minimap.height + 4);
  ctx.lineTo(2, this.minimap.height + 4);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
  
  for(var i = 0; i < this.world.minimap_markers.length; i++) {
    var marker = this.world.minimap_markers[i];
    var miniX = Math.floor(this.minimap.width * (marker.translate.x / this.world.width));
    var miniY = Math.floor(this.minimap.height * (marker.translate.y / this.world.height));
    
    ctx.fillStyle = marker.color;
    ctx.beginPath();
    ctx.ellipse(miniX, miniY, marker.radius, marker.radius, 0, 0, Math.PI * 2, false);
    ctx.fill();
  }
  
  var myMiniX = Math.floor(this.minimap.width * (this.world.me.translate.x / this.world.width));
  var myMiniY = Math.floor(this.minimap.height * (this.world.me.translate.y / this.world.height));
  ctx.fillStyle = "#F00";
  ctx.beginPath();
  ctx.ellipse(myMiniX, myMiniY, 2, 2, 0, 0, Math.PI * 2, false);
  ctx.fill();
  
  this.minimap.dirty = false;
  var asimg = this.canvas_to_image(canv, function() {
    iorpg.minimap.img = asimg;
  });
};

iorpg.draw_playing_ui = function() {
  var act_index = -1;
  for(var i = 0; i < this.playing_ui_info.spells.length; i++) {
    var spl = this.playing_ui_info.spells[i];
    if(spl.trying_to_use)
      act_index = i;
    
    if(spl.hovered) {
      if(this.mouse_left_down)
        this.ctx.drawImage(spl.icon_pressed.img, spl.translate.x + spl.icon_pressed.translate.x, spl.translate.y + spl.icon_pressed.translate.y);
      else
        this.ctx.drawImage(spl.icon_hovered.img, spl.translate.x + spl.icon_hovered.translate.x, spl.translate.y + spl.icon_hovered.translate.y);
    }else
      this.ctx.drawImage(spl.icon_standard.img, spl.translate.x + spl.icon_standard.translate.x, spl.translate.y + spl.icon_standard.translate.y);
  }
  
  if(act_index >= 0) {
    var spl = this.playing_ui_info.spells[act_index];
    if(spl.radius) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = "#D24";
      this.ctx.lineWidth = 2;
      this.ctx.ellipse(this.canvas.width / 2, this.canvas.height / 2, spl.radius, spl.radius, 0, 0, Math.PI * 2, false);
      this.ctx.stroke();
    }
  }
  
  if(this.minimap.dirty) {
    this.clean_minimap();
  }
  
  if(this.minimap.img) {
    this.ctx.drawImage(this.minimap.img, this.minimap.translate.x, this.minimap.translate.y);
  }
};

iorpg.anim_frame_requested = function(timestamp) {
  window.requestAnimationFrame(function() { iorpg.anim_frame_requested.apply(iorpg, arguments); });
  var delta_time = 0;
  if(this.last_draw_time != 0)
    delta_time = timestamp - this.last_draw_time;
  
  this.last_draw_time = timestamp;
  
  
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  switch(this.game_state) {
    case this.GAME_STATES.LOADING:
      if(this.resource_loading_counter > 0) {
        if(this.IMAGES.LOADING in this.images) {
          var img = this.images[this.IMAGES.LOADING];
          
          this.ctx.drawImage(img, this.loading_ui_info.translate.x, this.loading_ui_info.translate.y);
        }
      }else {
        this.change_game_state(this.GAME_STATES.LOADING_TRANSITION);
        this.__transition_time_start = timestamp;
        this.__transition_easing = BezierEasing(0.98, 0.32, 0.92, 0.84);
        var img = this.images[this.IMAGES.LOADING];
        
        this.ctx.drawImage(img, this.loading_ui_info.translate.x, this.loading_ui_info.translate.y);
      }
      break;
    case this.GAME_STATES.LOADING_TRANSITION:
      var time_since_transition_ms = timestamp - this.__transition_time_start;
      if(time_since_transition_ms > 500) {
        this.change_game_state(this.GAME_STATES.SELECT_HERO);
      }else {
        var transition_progress_perc = (time_since_transition_ms) / 500.0;
        var img = this.images[this.IMAGES.LOADING];
        
        var y_offset = this.__transition_easing(transition_progress_perc) * (this.loading_transition_ui_info.destination_y - this.loading_ui_info.translate.y);
        
        this.ctx.drawImage(img, this.loading_ui_info.translate.x, this.loading_ui_info.translate.y + y_offset)
      }
      break;
    case this.GAME_STATES.SELECT_HERO:
      var warImg = (this.select_hero_ui_info.warrior.hovered) ? (this.mouse_left_down ? this.images[this.IMAGES.SELECT_WARRIOR_PRESSED] : this.images[this.IMAGES.SELECT_WARRIOR_HOVERED]) : this.images[this.IMAGES.SELECT_WARRIOR_STANDARD];
      var hunImg = (this.select_hero_ui_info.hunter.hovered) ? (this.mouse_left_down ? this.images[this.IMAGES.SELECT_HUNTER_PRESSED] : this.images[this.IMAGES.SELECT_HUNTER_HOVERED]) : this.images[this.IMAGES.SELECT_HUNTER_STANDARD];
      var priImg = (this.select_hero_ui_info.priest.hovered) ? (this.mouse_left_down ? this.images[this.IMAGES.SELECT_PRIEST_PRESSED] : this.images[this.IMAGES.SELECT_PRIEST_HOVERED]) : this.images[this.IMAGES.SELECT_PRIEST_STANDARD];
      
      this.ctx.drawImage(warImg, this.select_hero_ui_info.warrior.translate.x, this.select_hero_ui_info.warrior.translate.y);
      this.ctx.drawImage(hunImg, this.select_hero_ui_info.hunter.translate.x, this.select_hero_ui_info.hunter.translate.y);
      this.ctx.drawImage(priImg, this.select_hero_ui_info.priest.translate.x, this.select_hero_ui_info.priest.translate.y);
      break;
    case this.GAME_STATES.PLAYING:
      if(!(this.world.me.id in this.world.ids_to_indexes))
        break;
      if(this.interpolated_timestamp != this.new_world.timestamp) {
        this.interpolated_timestamp = Math.min(this.interpolated_timestamp + delta_time * this.interpolation_factor, this.new_world.timestamp);
      }
      
      this.update_camera();
      this.draw_entities(1);
      this.draw_entities(2);
      this.draw_playing_ui();
      
      break;
  }
};

iorpg.init = function() {
  this.game_state = this.GAME_STATES.LOADING;
  this.game_body = document.body;
  this.canvas = document.getElementById("game_canvas");
  if(!this.canvas)
    return;
  this.ctx = this.canvas.getContext("2d");
  
  this.game_body.onresize = function() { iorpg.resize_canvas(); }
  iorpg.resize_canvas();
  this.load_images();
  window.addEventListener("mousemove", function(e) {
    iorpg.mouse_pos.x = e.pageX;
    iorpg.mouse_pos.y = e.pageY;
    iorpg.handle_mouse_state();
  });
  window.addEventListener("mousedown", function(e) {
    if(e.button == 0) {
      iorpg.mouse_left_down = true;
      iorpg.handle_mouse_state();
    }
  });
  window.addEventListener("mouseup", function(e) {
    if(e.button == 0) {
      iorpg.mouse_left_down = false;
      iorpg.mouse_pos.x = e.pageX;
      iorpg.mouse_pos.y = e.pageY;
      iorpg.handle_mouse_state();
      iorpg.handle_mouse_released();
    }
  });
  window.addEventListener("keydown", function(e) {
    iorpg.handle_key_down(e);
  });
  window.addEventListener("keyup", function(e) {
    iorpg.handle_key_up(e);
  });
  window.requestAnimationFrame(function() { iorpg.anim_frame_requested.apply(iorpg, arguments); });
};

iorpg.init();