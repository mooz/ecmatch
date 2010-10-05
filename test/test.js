EC.export(this);

print = function () {
    console.log.apply(console, arguments);
};

function assert(a, b, name) {
    if (a === b)
        print("Test pass" + (name ? " :: " + name : ""));
    else {
        var failedStr = "Test failed" + (name ? " :: " + name : "");
        print(failedStr);
        throw failedStr;
    }
}

// ============================================================ //

// Define case classes using EC.cc (case class)
var Var =
    EC.def(function (name) {});

var Number =
    EC.def(function (num) {});

var UnOp =
    EC.def(function (op, arg) {});

var BinOp =
    EC.def(function (op, left, right) {});

// ============================================================ //

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

// ============================================================ //

print(simplifyTop(UnOp("-", UnOp("-", Var("x")))));

var fib = EC.matcher({
    0: 0,
    1: 1,
    n: function (_) {
        with (_) {
            return fib(n - 1) + fib(n - 2);
        }
    }
});

console.log(fib(10));

console.log(
    EC.match(-5 + ~~(Math.random() * 10), {
        x: EC.when("x > 0", function (_, it) {
            return it + " is positive";
        }),
        y: EC.when(function (_, it) { return it < 0; }, function (_, it) {
            return it + " is negative";
        }),
        z: function (it) {
            return it + " is zero";
        }
    })
);

EC.match([1, 2, 3, 4, 5], {
    "[, x, y, , z]": function (_) {
        with (_)
            print(x, y, z);
    },

    _: function () {
        print("not matched");
    }
});

EC.match({ x: { a: 10, b: 20 }, y: [1, 2, 3, 4], z: "foo" }, {
    "{ x: {a, b}, y: [c, d], z: e }": function (_, that) {
        console.dir(_);
    }
});

var year = EC.match(new Date(), {
    "Date()"   : function (_, that) { return that.getYear(); },
    "Number()" : function (_, that) { return that; },
    _          : function (_, that) { return null; }
});

console.log(year);

console.log(EC.match(10, {
    2: "foo",
    20: "bar",
    30: "hogehoge",
    _: "!!!"
}));

function Point(x, y) {
    this.x = x;
    this.y = y;
}

console.log(EC.match(new Point(10, 20), {
    "Point({x:10, y:_})" : function (_, that) { return _; },
    _               : function (_, that) { return null; }
}));
