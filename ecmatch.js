/*
 * ECMatch - Pattern match library for ECMAScript (JavaScript)
 *
 * author mooz <stillpedant@gmail.com>
 */

var EC = (function () {
    var Util = {
        tap: function tap(v) {
            console.dir(v);
            return v;
        },

        skip:
        function skip(str, pat) {
            var matched = str.match(pat);
            return matched ? str.slice(matched[0].length) : str;
        },

        error:
        function error(msg) {
            var caller = error.caller;
            throw caller.name + " :: " + msg;
        },

        expected:
        function expected(msg, exp, got) {
            Util.error(msg + ". Expected '" + exp + "' but got '" + got + "'");
        }
    };

    var Parser = {
        // Token Type
        TT: {
            ARRAY         : "Array",
            OBJECT        : "Object",
            ObjectElement : "ObjectElement",
            FUNCTION      : "Function",
            IDENTIFIER    : "Identifier",
            ANY           : "Any",
            BLANK         : "Blank"
        },

        // Character
        CH: {
            OBJECT_B  : "{",
            OBJECT_E  : "}",
            ARRAY_B   : "[",
            ARRAY_E   : "]",
            ANY       : "?",
            SEPARATOR : ","
        },

        skipSpaces:
        function skipSpaces() {
            this.rest = Util.skip(this.rest, /\s*/);
        },

        skipChars:
        function skipChars(count) {
            this.rest = this.rest.slice(count);
        },

        peekCurrent:
        function peekCurrent() {
            return this.rest.charAt(0);
        },

        getCurrent:
        function getCurrent() {
            var current = this.gotLast = this.rest.charAt(0);
            this.rest = this.rest.slice(1);
            return current;
        },

        unget:
        function unget(c) {
            this.rest = c + this.rest;
        },

        hasNext:
        function hasNext() {
            return !!this.rest.length;
        },

        // ============================================================ //
        // Pattern       := Array | Object | Function | Any
        // Element       := Pattern | Identifier
        // Array         := "[" (Element? ",")* Element? "]"
        // Object        := "{" ((ObjectElement ",")* ObjectElement)? "}"
        // ObjectElement := Identifier (":" Element)?
        // Function      := Identifier "(" Object? ")"
        // Identifier    := /^[a-zA-Z$][a-zA-Z0-9$]*/
        // Any           := "?"
        // ============================================================ //

        parse:
        function parse(str) {
            this.whole = this.rest = str;

            return this.parsePattern();
        },

        parsePattern:
        function parsePattern(allowIdentifier) {
            var token;

            this.skipSpaces();

            switch (this.peekCurrent()) {
            case this.CH.ARRAY_B:
                token = this.parseArray();
                break;
            case this.CH.OBJECT_B:
                token = this.parseObject();
                break;
            case this.CH.ANY:
                token = this.parseAny();
                break;
            default:
                token = this.parseFunction(allowIdentifier);
                break;
            }

            this.skipSpaces();

            return token;
        },

        parseElement:
        function parseElement() {
            return this.parsePattern(true);
        },

        parseObjectElement:
        function parseObjectElement() {
            var key = this.parseIdentifier();

            var token = {
                type     : this.TT.ObjectElement,
                key      : key.name,
                value    : null
            };

            this.skipSpaces();

            if (this.peekCurrent() === ":") {
                this.getCurrent();
                token.value = this.parseElement();
            }

            return token;
        },

        parseElements:
        function parseElements(endSign) {
            return this.parseSeparatedTokens({
                endSign    : endSign,
                allowBlank : true,
                action     : function (c) {
                    return this.parseElement();
                }
            });
        },

        parseObjectElements:
        function parseElements(endSign) {
            return this.parseSeparatedTokens({
                endSign    : endSign,
                allowBlank : false,
                action     : function (c) {
                    return this.parseObjectElement();
                }
            });
        },

        parseSeparatedTokens:
        function parseSeparatedTokens(context) {
            var tokens = [];

            var endSign    = context.endSign;
            var allowBlank = context.allowBlank;
            var action     = context.action;

            while (this.hasNext()) {
                this.skipSpaces();

                var c = this.peekCurrent();
                if (c === endSign)
                    break;

                if (c === this.CH.SEPARATOR) {
                    if (allowBlank)
                        tokens.push({ type : this.TT.BLANK });
                    else
                        Util.error("Blank element is not allowed in this context");
                } else {
                    var parsed = action.call(this, c);

                    if (parsed)
                        tokens.push(parsed);
                }

                var c2 = this.peekCurrent();
                if (c2 === endSign)
                    break;

                // consume separator
                if (c2 !== this.CH.SEPARATOR)
                    Util.error("Expected ',' or '" + endSign + "' but got " + c2);

                this.getCurrent(); // consume separator
            }

            if (this.getCurrent() !== endSign)
                Util.expected("Unclosed separated tokens", endSign, this.gotLast);

            return tokens;
        },

        parseArray:
        function parseArray() {
            if (this.getCurrent() !== this.CH.ARRAY_B)
                Util.expected("Invalid Array", this.CH.ARRAY_B, this.gotLast);

            return {
                type     : this.TT.ARRAY,
                children : this.parseElements(this.CH.ARRAY_E)
            };
        },

        parseObject:
        function parseObject() {
            if (this.getCurrent() !== this.CH.OBJECT_B)
                Util.expected("Invalid object", this.CH.OBJECT_B, this.gotLast);

            return {
                type     : this.TT.OBJECT,
                children : this.parseObjectElements(this.CH.OBJECT_E)
            };
        },

        parseFunction:
        function parseFunction(acceptIdentifier) {
            var nameToken = this.parseIdentifier();

            this.skipSpaces();

            if (this.peekCurrent() !== "(") {
                if (acceptIdentifier)
                    return nameToken;
                Util.expected("Invalid function", "(", this.peekCurrent());
            }

            this.getCurrent();  // consume "("

            var token = {
                type : this.TT.FUNCTION,
                name : nameToken.name
            };

            this.skipSpaces();

            if (this.peekCurrent() === this.CH.OBJECT_B)
                token.children = this.parseObject();
            else
                token.children = null;

            this.skipSpaces();

            if (this.getCurrent() !== ")")
                Util.expected("Invalid function", ")", this.gotLast);

            return token;
        },

        parseIdentifier:
        function parseIdentifier() {
            var m = this.rest.match(/^[_a-zA-Z$][_a-zA-Z0-9$]*/);

            if (!m)
                Util.error("Invalid identifier '" + this.peekCurrent() + "'");

            this.skipChars(m[0].length);

            return {
                type : this.TT.IDENTIFIER,
                name : m[0]
            };
        },

        parseAny:
        function parseAny() {
            if (this.getCurrent() !== this.CH.ANY)
                Util.expected("Invalid any", this.CH.ANY, this.gotLast);

            return {
                type : this.TT.ANY
            };
        }
    };

    var Matcher = {
        match:
        function (target, node) {
            var result = {};

            switch (node.type) {
            case "Array":
                if (!(target instanceof Array))
                    return false;

                for (var i = 0; i < node.children.length; ++i) {
                    var v = node.children[i];
                    if (v.name)
                        result[v.name] = target[i];
                }
                break;
            case "Function":
                var constructor;

                if (typeof target !== "undefined" && target !== null)
                    constructor = target.constructor;

                if (!constructor || constructor.name !== node.name)
                    return false;
                break;
            default:
                return false;
            }

            return result;
        }
    };

    var self = {
        Parser: Parser,
        Matcher: Matcher,

        export:
        function (context, name) {
            name = name || "match";

            if (context) {
                context[name] = function () {
                    return self.match.apply(self, arguments);
                };
            }
        },

        match:
        function match(target, patterns) {
            var value;

            patterns.some(function (pair) {
                var pattern = pair[0];
                var handler = pair[1];

                var node   = Parser.parse(pattern);
                var result = Matcher.match(target, node);

                if (result) {
                    value = handler(result, target);
                    return true; // break;
                }
            });

            return value;
        }
    };

    return self;
})();

