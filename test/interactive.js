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

    window.addEventListener("load", function () {
        var resultArea           = document.getElementById("result");
        var patternStructureArea = document.getElementById("pattern-structure");

        var patternInputArea = document.getElementById("input-pattern");
        var valueInputArea   = document.getElementById("input-value");

        function echoTo(txt, target, klass) {
            var elem = E.text(txt);

            removeAllChild(target);
            var newHolder = document.createElement("div");
            newHolder.setAttribute("class", klass);
            newHolder.appendChild(elem);
            target.appendChild(newHolder);
        }

        function onPatternUpdate(ev) {
            var code = patternInputArea.value;

            try {
                var parsed = EC.Parser.parse(code);
            } catch (x) {
                echoTo(x, patternStructureArea, "error");
                return;
            }

            echoTo(serialize(parsed), patternStructureArea);
        }

        function onValueUpdate(ev) {
            try {
                var value = eval("(" + valueInputArea.value + ")");
            } catch (x) {
                echoTo(x.message || "Failed to parse value", resultArea, "error");
                return;
            }
            var pattern = patternInputArea.value;

            var patterns = {};
            patterns[pattern] = function (_) {
                echoTo(serialize(_), resultArea);
            };

            patterns._ = function () {
                echoTo("Not match", resultArea, "error");
            };

            EC.match(value, patterns);
        }

        patternInputArea.addEventListener("input", onPatternUpdate, false);
        valueInputArea.addEventListener("input", onValueUpdate, false);

        patternInputArea.addEventListener("input", onValueUpdate, false);
        valueInputArea.addEventListener("input", onPatternUpdate, false);
    }, false);
})();
