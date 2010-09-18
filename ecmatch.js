/*
 * ECMatch - Pattern match library for ECMAScript (JavaScript)
 *
 * written by mooz <stillpedant@gmail.com>
 *
 * ==================================================
 *   Usage
 * ==================================================
 *
 * EC.match([1, 2, 3], {
 *     "[x, y]": function (r) {
 *         with (r) {
 *             print(x, y); // => 1, 2
 *         }
 *     },
 *
 *     "_": function () {
 *         print("not matched");
 *     }
 * });
 *
 * EC.match(new Date(), {
 *     "Date()": function (_, date) {
 *         print("I'm date " + date);
 *     },
 *
 *     "_": function () {
 *         print("not matched");
 *     }
 * });
 *
 */

var EC = (function () {
    var util = {
        chomp:
        function chomp(str, opt_info) {
            if (opt_info)
                opt_info.offset = str.match(/^\s*/)[0].length;

            return str.replace(/^\s+/, "");
        },

        last:
        function last(seq) {
            // TODO: should use charAt
            return seq[seq.length - 1];
        },

        skip:
        function skip(str, pat) {
            var matched = str.match(pat);
            return matched ? str.slice(matched[0].length) : str;
        }
    };

    // Pattern    := Array | Object | Function
    // Array      := "[" (Identifier ",")* Identifier? "]"
    // Object     := "{" (Identifier : Pattern)* "}"
    // Function   := "{" Object? "}"
    // Identifier := /^[a-zA-Z$][a-zA-Z0-9$]*/

    function parsePatterns(str, endc) {
        var token;
        var tokens = [];
        var stream = str;

        while (stream.length && (stream.charAt(0) !== endc)) {
            tokens.push(token = parsePattern(stream));
            stream = util.skip(stream.slice(token.nextIndex), /\s*,\s*/);
        }

        if (stream.charAt(0) !== endc)
            throw "Parse Error :: Unclosed patterns. " + endc + " is needed";

        return {
            tokens    : tokens,
            nextIndex : str.length - (stream.length + 1)
        };
    }

    function parseArray(str) {
        // TODO: assertEq(str[0], "[");
        var result = parsePatterns(str.slice(1), "]");

        return {
            type      : "Array",
            children  : result.tokens,
            nextIndex : result.nextIndex
        };
    }

    function parseObject(str) {
        // TODO: assertEq(str[0], "{");
        // TODO: Implement this.
        var result = parsePatterns(str.slice(1), "}");

        return {
            type      : "Object",
            children  : result.tokens,
            nextIndex : result.nextIndex
        };
    }

    function parseFunction(str, m) {
        // TODO: assertEq what?
        var token = {
            type : "Function",
            name : m[1]
        };

        var m2;

        if ((m2 = str.match(/^\(\t*\)/))) {
            token.children  = [];
            token.nextIndex = m2[0].length;
        } else if (str.match(/^\({/)) {
            var result = parseObject(str.slice(m[0].length), ")");
            token.children  = result.tokens;
            token.nextIndex = result.nextIndex;
        }

        return token;
    }

    function parseIdentifier(str, m) {
        // TODO: assertEq what?
        return {
            type      : "Identifier",
            name      : m[0],
            nextIndex : m[0].length
        };
    }

    function parsePattern(str) {
        var ci     = {};           // chomp info
        var stream = util.chomp(str, ci);
        var m;

        var token;

        if ((m = stream.match(/^\[/))) {
            // array
            token = parseArray(stream);
        } else if ((m = stream.match(/^{/))) {
            // object
            token = parseObject(stream);
        } else if ((m = stream.match(/^([_a-zA-Z$][_a-zA-Z0-9$]*)\t*\(/))) {
            token = parseFunction(stream, m);
        } else if ((m = stream.match(/^[_a-zA-Z$][_a-zA-Z0-9$]*/))) {
            token = parseIdentifier(stream, m);
        } else if (stream.match(/^_/)) {
            // guard
            token = {
                type      : "Guard",
                nextIndex : 1
            };
        } else if (stream.match(/^_/)) {
            // sucks
            throw "Uknown";
        }

        token.nextIndex += ci.offset;

        return token;
    }

    var self = {
        match:
        function match(target, patterns) {
            var matchers = [];

            for (var pattern in patterns) if (patterns.hasOwnProperty(pattern)) {
                var token = parsePattern(pattern);

                matchers.push([token, patterns[pattern]]);
            }

            matchers.some(function (pair) {
                var token   = pair[0];
                var handler = pair[1];

                var result = {};

                switch (token.type) {
                case "Array":
                    if (!(target instanceof Array))
                        return false;

                    for (var i = 0; i < token.children.length; ++i) {
                        var v = token.children[i];
                        if (v.name)
                            result[v.name] = target[i];
                    }
                    break;
                case "Function":
                    var constructor;

                    if (typeof target !== "undefined" && target !== null)
                        constructor = target.constructor;

                    if (!constructor || constructor.name !== token.name)
                        return false;
                    break;
                default:
                    return false;
                }

                return (handler(result, target), true);
            });
        }
    };

    return self;
})();

