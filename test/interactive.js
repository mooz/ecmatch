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

            echo(E.text(new Json.Formatter(parsed).value));
        }

        inputArea.addEventListener("input", onUpdate, false);
    }, false);
})();
