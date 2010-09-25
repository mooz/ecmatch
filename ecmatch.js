/*
 * ECMatch - Pattern match library for ECMAScript (JavaScript)
 *
 * author mooz <stillpedant@gmail.com>
 */

var EC = (function () {
    var Util = {
        tap:
        function tap(v) {
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
        },

        hashEach:
        function hashEach(target, f, self) {
            var r;
            for (var k in target) if (target.hasOwnProperty(k)) {
                var v = target[k];
                if (self)
                    r = f.call(self, k, v);
                else
                    r = f(k, v);

                if (r === true)
                    break;
            }
        }
    };

    var Parser = {
        // Token Type
        TT: {
            ARRAY          : "Array",
            OBJECT         : "Object",
            OBJECT_ELEMENT : "ObjectElement",
            FUNCTION       : "Function",
            IDENTIFIER     : "Identifier",
            NUMBER         : "Number",
            STRING         : "String",
            ANY            : "Any",
            BLANK          : "Blank"
        },

        // Character
        CH: {
            OBJECT_B  : "{",
            OBJECT_E  : "}",
            ARRAY_B   : "[",
            ARRAY_E   : "]",
            ANY       : "_",
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
        // Pattern       := Array | Object | Function | Any | Identifier | Number | String
        // Array         := "[" (Pattern? ",")* Pattern? "]"
        // Object        := "{" ((ObjectElement ",")* ObjectElement)? "}"
        // ObjectElement := Identifier (":" Pattern)?
        // Function      := Identifier "(" Object? ")"
        // Identifier    := /^[a-zA-Z$][a-zA-Z0-9$]*/
        // Number        := /^[0-9]*(?:\.[0-9](?:e[0-9]+)?)?/
        // String        := /^(["'])(?:[^\1]|\\\1)*?\1/
        // Any           := "_"
        // ============================================================ //

        parse:
        function parse(str) {
            this.whole = this.rest = str;

            var topLevel = this.parsePattern();

            this.skipSpaces();

            if (this.hasNext())
                throw "Trailing stubs found : '" + this.rest + "'";

            return topLevel;
        },

        parsePattern:
        function parsePattern() {
            var token, c;

            this.skipSpaces();

            switch (c = this.peekCurrent()) {
            case this.CH.ARRAY_B:
                token = this.parseArray();
                break;
            case this.CH.OBJECT_B:
                token = this.parseObject();
                break;
            case "'":
            case '"':
                token = this.parseString();
                break;
            default:
                if (/^[0-9]/.test(c)) {
                    token = this.parseNumber();
                } else {
                    token = this.parseFunction(true);
                }
                break;
            }

            this.skipSpaces();

            return token;
        },

        parseObjectElement:
        function parseObjectElement() {
            var key = this.parseIdentifier();

            var token = {
                type     : this.TT.OBJECT_ELEMENT,
                name     : key.name,
                value    : null
            };

            this.skipSpaces();

            if (this.peekCurrent() === ":") {
                this.getCurrent();
                token.value = this.parsePattern();
            }

            return token;
        },

        parsePatterns:
        function parsePatterns(endSign) {
            return this.parseSeparatedTokens({
                endSign    : endSign,
                allowBlank : true,
                action     : function (c) {
                    return this.parsePattern();
                }
            });
        },

        parseObjectElements:
        function parseObjectElements(endSign) {
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
                children : this.parsePatterns(this.CH.ARRAY_E)
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

            return m[0] === this.CH.ANY ? {
                type : this.TT.ANY
            } : {
                type : this.TT.IDENTIFIER,
                name : m[0]
            };
        },

        parseNumber:
        function parseNumber() {
            var m = this.rest.match(/^[0-9]*(?:\.[0-9](?:e[0-9]+)?)?/);

            if (!m)
                Util.error("Invalid Number '" + this.rest + "'");

            this.skipChars(m[0].length);

            return {
                type  : this.TT.NUMBER,
                value : parseFloat(m[0])
            };
        },

        parseString:
        function parseString() {
            var m = this.rest.match(/^(["'])((?:[^\1]|\\\1)*?)\1/);

            if (!m)
                Util.error("Invalid String '" + this.rest + "'");

            this.skipChars(m[0].length);

            return {
                type  : this.TT.STRING,
                value : m[2]
            };
        }
    };

    var Matcher = {
        match:
        function (target, node, result) {
            var TT = Parser.TT;

            switch (node.type) {
            case TT.ARRAY:
                if (!(target instanceof Array))
                    return false;

                for (var i = 0; i < node.children.length; ++i) {
                    var v = node.children[i];
                    Matcher.match(target[i], v, result);
                }
                break;
            case TT.FUNCTION:
                var constructor;

                if (typeof target !== "undefined" && target !== null)
                    constructor = target.constructor;

                if (!constructor || constructor.name !== node.name)
                    return false;
                break;
            case TT.OBJECT:
                if (!(target instanceof Object))
                    return false;

                for (var i = 0; i < node.children.length; ++i) {
                    var v = node.children[i];
                    if (v.name)
                        Matcher.match(target[v.name], v, result);
                }

                break;
            case TT.IDENTIFIER:
                result[node.name] = target;
                break;
            case TT.OBJECT_ELEMENT:
                if (node.value)
                    return Matcher.match(target, node.value, result);

                result[node.name] = target;
                break;
            case TT.NUMBER:
            case TT.STRING:
                return node.value == target;
                break;
            case TT.ANY:
                break;
            default:
                return false;
            }

            return true;
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

            Util.hashEach(patterns, function (pattern, handler) {
                var node   = Parser.parse(pattern);
                var result = {};

                if (Matcher.match(target, node, result)) {
                    value = typeof handler === "function" ?
                        handler(result, target) : handler;
                    return true; // break;
                }
            });

            return value;
        }
    };

    return self;
})();

