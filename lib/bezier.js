/**
 * https://github.com/gre/bezier-easing
 * BezierEasing - use bezier curve for transition easing function
 * by Gaëtan Renaudeau 2014 - 2015 – MIT License
 */
// modified so it doesn't follow module pattern

// These values are established by empiricism with tests (tradeoff: performance VS precision)
var _BEZIER_NEWTON_ITERATIONS = 4;
var _BEZIER_NEWTON_MIN_SLOPE = 0.001;
var _BEZIER_SUBDIVISION_PRECISION = 0.0000001;
var _BEZIER_SUBDIVISION_MAX_ITERATIONS = 10;

var _BEZIER_kSplineTableSize = 11;
var _BEZIER_kSampleStepSize = 1.0 / (_BEZIER_kSplineTableSize - 1.0);

var _BEZIER_float32ArraySupported = typeof Float32Array === 'function';

function _BEZIER_A (aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
function _BEZIER_B (aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
function _BEZIER_C (aA1)      { return 3.0 * aA1; }

// Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
function _BEZIER_calcBezier (aT, aA1, aA2) { return ((_BEZIER_A(aA1, aA2) * aT + _BEZIER_B(aA1, aA2)) * aT + _BEZIER_C(aA1)) * aT; }

// Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
function _BEZIER_getSlope (aT, aA1, aA2) { return 3.0 * _BEZIER_A(aA1, aA2) * aT * aT + 2.0 * _BEZIER_B(aA1, aA2) * aT + _BEZIER_C(aA1); }

function _BEZIER_binarySubdivide (aX, aA, aB, mX1, mX2) {
  var currentX, currentT, i = 0;
  do {
    currentT = aA + (aB - aA) / 2.0;
    currentX = _BEZIER_calcBezier(currentT, mX1, mX2) - aX;
    if (currentX > 0.0) {
      aB = currentT;
    } else {
      aA = currentT;
    }
  } while (Math.abs(currentX) > _BEZIER_SUBDIVISION_PRECISION && ++i < _BEZIER_SUBDIVISION_MAX_ITERATIONS);
  return currentT;
}

function _BEZIER_newtonRaphsonIterate (aX, aGuessT, mX1, mX2) {
 for (var i = 0; i < _BEZIER_NEWTON_ITERATIONS; ++i) {
   var currentSlope = _BEZIER_getSlope(aGuessT, mX1, mX2);
   if (currentSlope === 0.0) {
     return aGuessT;
   }
   var currentX = _BEZIER_calcBezier(aGuessT, mX1, mX2) - aX;
   aGuessT -= currentX / currentSlope;
 }
 return aGuessT;
}

function BezierEasing (mX1, mY1, mX2, mY2) {
  if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) {
    throw new Error('bezier x values must be in [0, 1] range');
  }

  // Precompute samples table
  var sampleValues = _BEZIER_float32ArraySupported ? new Float32Array(_BEZIER_kSplineTableSize) : new Array(_BEZIER_kSplineTableSize);
  if (mX1 !== mY1 || mX2 !== mY2) {
    for (var i = 0; i < _BEZIER_kSplineTableSize; ++i) {
      sampleValues[i] = _BEZIER_calcBezier(i * _BEZIER_kSampleStepSize, mX1, mX2);
    }
  }

  function getTForX (aX) {
    var intervalStart = 0.0;
    var currentSample = 1;
    var lastSample = _BEZIER_kSplineTableSize - 1;

    for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
      intervalStart += _BEZIER_kSampleStepSize;
    }
    --currentSample;

    // Interpolate to provide an initial guess for t
    var dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
    var guessForT = intervalStart + dist * _BEZIER_kSampleStepSize;

    var initialSlope = _BEZIER_getSlope(guessForT, mX1, mX2);
    if (initialSlope >= _BEZIER_NEWTON_MIN_SLOPE) {
      return _BEZIER_newtonRaphsonIterate(aX, guessForT, mX1, mX2);
    } else if (initialSlope === 0.0) {
      return guessForT;
    } else {
      return _BEZIER_binarySubdivide(aX, intervalStart, intervalStart + _BEZIER_kSampleStepSize, mX1, mX2);
    }
  }

  return function BezierEasing (x) {
    if (mX1 === mY1 && mX2 === mY2) {
      return x; // linear
    }
    // Because JavaScript number are imprecise, we should guarantee the extremes are right.
    if (x === 0) {
      return 0;
    }
    if (x === 1) {
      return 1;
    }
    return _BEZIER_calcBezier(getTForX(x), mY1, mY2);
  };
};