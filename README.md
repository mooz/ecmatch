ECMatch
========

Pattern match library for ECMAScript (JavaScript).

Usage
=====

    EC.match([1, 2, 3, 4, 5], {
        "[, x, y, , z]": function (_, that) {
            with (_) {
                print(x, y, z); // => 2, 3, 5
            }
        },

        _: function () {
            print("not matched");
        }
    });

    var year = EC.match(new Date(), {
        "Date()": function (_, that) {
            return that.getYear();
        },

        "Number()": function (_, that) {
            return that;
        },

        _: function (_, that) {
            return null;
        }
    });

    print(year);
