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

EC.match([1, 2, 3, 4, 5], {
    "[, x, y, , z]": function (r) {
        with (r) {
            print(x, y, z);
        }
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
    "Date()": function (_, that) {
        return that.getYear();
    },

    "Number()": function (_, that) {
        return that;
    },

    "?": function (_, that) {
        return null;
    }
});

console.log(year);

// console.dir(EC.Parser.parse("x"));
console.dir(EC.Parser.parse("[  x  , ?, _Fo, lo, { foo: {f:? }, a }  , z, [ ]  ]"));
