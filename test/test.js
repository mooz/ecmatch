print = function () {
    console.log.apply(console, arguments);
};

EC.match([1, 2, 3], {
    "[x, y]": function (r) {
        with (r) {
            print(x, y);
        }
    },

    "_": function () {
        print("not matched");
    }
});

EC.match(new Date(), {
    "Date()": function (_, date) {
        print("I'm date :: " + date.toString());
    },

    "_": function () {
        print("not matched");
    }
});
