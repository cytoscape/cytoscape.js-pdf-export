// https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/arcTo

/* Some math for 2-D vectors */
class Math2D {
  /* Create new point */
  static point(x = 0, y = 0) {
    return { x: x, y: y };
  }

  /* Create new vector */
  static vector(x = 0, y = 0) {
    return this.point(x, y);
  }

  /* Subtraction: difference = minuend - subtrahend */
  static subtract(difference, minuend, subtrahend) {
    difference.x = minuend.x - subtrahend.x;
    difference.y = minuend.y - subtrahend.y;
  }

  /* Find L2 norm */
  static L2(a) {
    return Math.hypot(a.x, a.y);
  }

  /* Dot product */
  static dot(a, b) {
    return a.x * b.x + a.y * b.y;
  }

  static mag(a) {
    return Math.sqrt(a.x * a.x + a.y * a.y);
  }

  // https://www.geeksforgeeks.org/orientation-3-ordered-points/
  // To find orientation of ordered triplet 
  // (p1, p2, p3). The function returns 
  // following values 
  // 'co' --> p, q and r are collinear
  // 'cw' --> Clockwise
  // 'ccw' --> Counterclockwise
  static orientation(p1, p2, p3) {
    // See 10th slides from following link 
    // for derivation of the formula
    let val = (p2.y - p1.y) * (p3.x - p2.x) - (p2.x - p1.x) * (p3.y - p2.y);
    if (val == 0) return 'co'; // collinear
    // clock or counterclock wise
    return (val > 0) ? 'ccw' : 'cw';
  }

  /* Find point on line defined parametrically by
    * L = P0 + t * direction */
  static linePointAt(P0, t, dir) {
    return this.point(P0.x + t * dir.x, P0.y + t * dir.y);
  }
} /* end of class Math2D */


/* Find the geometry that arcTo() uses to draw the path */
export function calculateArcToGeom({ P0, P1, P2, r }) {

  /* Find the center of a circle of radius r having a point T with a
   * tangent in the direction d and the center on the same side of
   * the tangent as dirTan. */
  function findCenter(T, d, r, dirTan) {
    /* Find direction of line normal to tangent line
     * Taking larger value to avoid division by 0.
     * a . n = 0. Set smaller component to 1 */
    const dn =
      Math.abs(d.x) < Math.abs(d.y)
        ? Math2D.point(1, -d.x / d.y)
        : Math2D.point(-d.y / d.x, 1);

    /* The normal may be pointing towards center or away.
     * Make towards center if not */
    if (Math2D.dot(dn, dirTan) < 0) {
      dn.x = -dn.x;
      dn.y = -dn.y;
    }

    /* Move a distance of the radius along line Tx + t * dn
     * to get to the center of the circle */
    return Math2D.linePointAt(T, r / Math2D.L2(dn), dn);
  }

  /* Test for coincidence. Note that points will have small integer
   * coordinates, so there is no issue with checking for exact
   * equality */
  const dir1 = Math2D.vector(P0.x - P1.x, P0.y - P1.y); // dir line 1
  if (dir1.x === 0 && dir1.y === 0) {
    // P0 and P1 coincident
    return [false];
  }

  const dir2 = Math2D.vector(P2.x - P1.x, P2.y - P1.y); // dir of line 2
  if (dir2.x === 0 && dir2.y === 0) {
    // P2 and P1 coincident
    return [false];
  }

  /* Magnitudes of direction vectors defining lines */
  const dir1Mag = Math2D.L2(dir1);
  const dir2Mag = Math2D.L2(dir2);

  /* Make direction vectors unit length */
  const dir1_unit = Math2D.vector(dir1.x / dir1Mag, dir1.y / dir1Mag);
  const dir2_unit = Math2D.vector(dir2.x / dir2Mag, dir2.y / dir2Mag);

  /* Angle between lines -- cos angle = a.b/(|a||b|)
   * Using unit vectors, so |a| = |b| = 1 */
  const dp = Math2D.dot(dir1_unit, dir2_unit);
  /* Test for collinearity */
  if (Math.abs(dp) > 0.999999) {
    /* Angle 0 or 180 degrees, or nearly so */
    return [false];
  }
  const angle = Math.acos(Math2D.dot(dir1_unit, dir2_unit));

  /* Distance to tangent points from P1 --
   * (T1, P1, C) form a right triangle (T2, P1, C) same triangle.
   * An angle of each triangle is half of the angle between the lines
   * tan(angle/2) = r / length(P1,T1) */
  const distToTangent = r / Math.tan(0.5 * angle);

  /* Locate tangent points */
  const T1 = Math2D.linePointAt(P1, distToTangent, dir1_unit);
  const T2 = Math2D.linePointAt(P1, distToTangent, dir2_unit);

  /* Center is along normal to tangent at tangent point at
   * a distance equal to the radius of the circle.
   * Locate center two ways. Should be equal */
  const dirT2_T1 = Math2D.vector(T2.x - T1.x, T2.y - T1.y);
  const dirT1_T2 = Math2D.vector(-dirT2_T1.x, -dirT2_T1.y);
  const C1 = findCenter(T1, dir1_unit, r, dirT2_T1);
  const C2 = findCenter(T2, dir2_unit, r, dirT1_T2);

  // /* Error in center calculations */
  const deltaC = Math2D.vector(C2.x - C1.x, C2.y - C1.y);
  // if (deltaC.x * deltaC.x + deltaC.y * deltaC.y > errorTolCenter) {
  //   console.error(
  //     `Programming or numerical error, ` +
  //       `P0(${P0.x},${P0.y}); ` +
  //       `P1(${P1.x},${P1.y}); ` +
  //       `P2(${P2.x},${P2.y}); ` +
  //       `r=${r};`,
  //   );
  // }

  /* Average the center values */
  const C = Math2D.point(C1.x + 0.5 * deltaC.x, C1.y + 0.5 * deltaC.y);

  // Calculate the angles that need to be passed to the arc(...) function
  function getAngleFromPosXAxis(T, C) {
    var dy = T.y - C.y;
    var dx = T.x - C.x;
    var theta = Math.atan2(dy, dx); // range (-PI, PI]
    return theta;
  }

  const a1 = getAngleFromPosXAxis(T1, C);
  const a2 = getAngleFromPosXAxis(T2, C);
  const ccw = Math2D.orientation(P0, P1, P2) === 'ccw';

  return { T1, T2, C, a1, a2, ccw };
} /* end of function findConstruction */