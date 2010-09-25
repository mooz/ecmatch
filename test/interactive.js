(function () {
    function removeAllChild(elem) {
        while (elem.hasChildNodes())
            elem.removeChild(elem.firstChild);
    }

    var E = {
        text: function (txt) {
            return document.createTextNode(txt);
        }
    };

    function serialize(obj, level, noIndent) {
        const INDENT_LEVEL = 4;

        if (!level)
            level = 0;

        function indentation(i) {
            return (new Array(i)).join(" ");
        }

        function indent(str) {
            return (noIndent ? "" : indentation(level)) + (str || "");
        }

        function nextIndentLevel() {
            return level + INDENT_LEVEL;
        }

        function escapeKey(k) {
            return k.replace(/"/g, '\\"');
        }

        var str = null;

        var type = typeof obj;

        if (obj === null) {
            str = indent("null");
        } else if (type === "string") {
            str = indent('"' + escapeKey(obj) + '"');
        } else if (type === "number" ||
                   type === "boolean") {
            str = indent(obj.toString());
        } else if (obj instanceof Array) {
            var buffer = [];

            buffer.push("[");

            for (var i = 0; i < obj.length; ++i) {
                var item = serialize(obj[i], nextIndentLevel());

                if (item)
                    buffer.push(item);
            }

            for (var i = 1; i < buffer.length; ++i)
                if (i !== buffer.length - 1)
                    buffer[i] += ",";

            buffer.push(indentation(level) + "]");

            str = buffer.map(function (s, i) { return i ? s : indent(s); }).join("\n");
        } else if (type === "object") {
            // object
            var buffer = [];

            buffer.push("{");

            for (var k in obj) if (obj.hasOwnProperty(k)) {
                var value = serialize(obj[k], nextIndentLevel(), true);

                if (value)
                    buffer.push(indentation(nextIndentLevel()) + '"' + escapeKey(k) + '": ' + value);
            }

            for (var i = 1; i < buffer.length; ++i)
                if (i !== buffer.length - 1)
                    buffer[i] += ",";

            buffer.push(indentation(level) + "}");

            str = buffer.map(function (s, i) { return i ? s : indent(s); }).join("\n");
        } else {
            // undefined
        }

        return str;
    }

    window.addEventListener("load", function () {
        var inputArea  = document.getElementById("input");
        var resultArea = document.getElementById("result");

        removeAllChild(resultArea);
        var dummyHolder = document.createElement("div");
        resultArea.appendChild(dummyHolder);

        function echo(elem, klass) {
            var newHolder = document.createElement("div");
            newHolder.setAttribute("class", klass);
            newHolder.appendChild(elem);
            resultArea.replaceChild(newHolder, dummyHolder);
            dummyHolder = newHolder;
        }

        function onUpdate(ev) {
            var code = inputArea.value;
            try {
                var parsed = EC.Parser.parse(code);
            } catch (x) {
                echo(E.text(x), "error");
                return;
            }

            echo(E.text(serialize(parsed)));
        }

        inputArea.addEventListener("input", onUpdate, false);
    }, false);
})();
