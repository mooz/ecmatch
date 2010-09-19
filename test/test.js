EC.export(this);

print = function () {
    console.log.apply(console, arguments);
};

EC.match([1, 2, 3, 4, 5], [
    ["[, x, y, , z]", function (r) {
        with (r) {
            print(x, y, z);
        }
    }],

    ["?", function () {
        print("not matched");
    }]
]);

var year = EC.match(new Date(), [
    ["Date()", function (_, that) {
        return that.getYear();
    }],

    ["Number()", function (_, that) {
        return that;
    }],

    ["?", function (_, that) {
        return null;
    }]
]);

console.log(year);

// console.dir(EC.Parser.parse("x"));
console.dir(EC.Parser.parse("[  x  , ?, _Fo, lo, { foo: {f:? }, a, ,  , a }  , z, [ ]  ]"));
