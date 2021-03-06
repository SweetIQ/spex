var $test = require("../test");

var $spex, // spex library instance;
    $lib; // name of the promise library;

function run(size, done) {
    var data = [];
    for (var i = 0; i < size; i++) {
        data.push(i);
    }
    $spex.batch(data)
        .then(function (d) {
            console.log($lib.name + "(" + $test.format(size) + "): " + d.duration);
            setTimeout(function () {
                done();
            }, 100);
        });
}

function run_all(spex, lib, done) {
    $spex = spex;
    $lib = lib;
    var sizes = [10, 100, 1000, 10000, 100000, 1000000, 10000000];

    function loop(idx) {
        run(sizes[idx], function () {
            idx++;
            if (idx < sizes.length) {
                loop(idx);
            } else {
                done();
            }
        });
    }

    loop(0);
}

$test.run(run_all, "Batch Values");
