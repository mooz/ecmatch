ECMatch
========

ECMatch is the pattern match library for ECMAScript (JavaScript).

Usage
=====

`ecmatch.js` defines the object `EC` which allows you to do pattern matching in JavaScript.

* `EC.match`
  * Do pattern matching
* `EC.when`
  * Adds pattern guard to `EC.match`
* `EC.def`
  * Use this method to define `case classes`

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
        y: EC.when("y < 0", function (_, it) {
            return it + " is negative";
        }),
        z: function (it) {
            return it + " is zero";
        }
    });

Here is pretty good example of `Constructor Patterns` and `Case Classes`.
(You may know this example, if you've read **Programming in Scala**.)

    // Define case classes using EC.def(definition, [prototype])

    var Var =
        EC.def(function (name) {});
    
    var Number =
        EC.def(function (num) {});
    
    var UnOp =
        EC.def(function (op, arg) {});
    
    var BinOp =
        EC.def(function (op, left, right) {});
    
    // EC.matcher allows you to define function which takes just 1 argument
    // and returns the result of its pattern matching.

    var simplifyTop = EC.matcher({
        'UnOp(["-", UnOp(["-", e])])': function (_) {
            return _.e;
        },
        'BinOp(["+", e, Number([0])])': function (_) {
            return _.e;
        },
        'BinOp(["*", e, Number([1])])': function (_) {
            return _.e;
        },
        _: function (_, it) {
            return it;
        }
    });

    // Instance can be created without `new`

    print(simplifyTop(UnOp("-", UnOp("-", Var("x"))))); // Var(x)

Examples
========

Fibonacci
---------

    var fib = EC.matcher({
        0: 0,
        1: 1,
        n: function (_) {
            with (_) {
                return fib(n - 1) + fib(n - 2);
            }
        }
    });
    
    console.log(fib(10)); // 55

Point
-----

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