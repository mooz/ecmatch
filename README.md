ECMatch
========

ECMatch is the pattern match library for ECMAScript (JavaScript).

Usage
=====

`ecmatch.js` defines the object `EC` which allows you use pattern matching.

* `EC.match`
  * Pattern matching
* `EC.when`
  * Adds pattern guard to `EC.match`

ECMatch supports nested patterns.

    var obj = {
        foo: [1, 2, 3, 4, 5],
        bar: "Bar",
        baz: -999
    };

    EC.match(obj, {
        "{ foo: [, x, y, , z], bar: s, baz }": function (_, it) {
            with (_) {
                print(x, y, z); // 2, 3, 5
                print(s);       // Bar
                print(baz);     // -999
            }
        },

        _: function () {
            print("not matched");
        }
    });

You can add pattern guard by specifying `EC.when`

    // Random number
    var num = -5 + ~~(Math.random() * 10);

    var numIs = EC.match(num, {
        x: EC.when("x > 0", function (_, it) {
            return it + " is positive";
        }),
        y: EC.when(function (_, it) { return it < 0; }, function (_, it) {
            return it + " is negative";
        }),
        z: function (it) {
            return it + " is zero";
        }
    });

You can use `constructor pattern` by specifying the constructor name.

    function Point2(x, y) {
        this.x = x;
        this.y = y;
    }
    
    function Point3(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    
    function inQuadrantI(x) {
        return EC.match(x, {
            "Point2({x, y})": EC.when("x > 0 && y > 0", true),
            "Point3({x, y, z})": EC.when("x > 0 && y > 0 && z > 0", true),
            _: false
        });
    };
    
    inQuadrantI(new Point2(10, 20));      // true
    inQuadrantI(new Point3(-10, 20, 30)); // false
