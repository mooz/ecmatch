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
