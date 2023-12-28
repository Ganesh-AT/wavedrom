'use strict';

const affirmSourceConfig = require('./affirm-source-config.js');

const renderAssign = require('logidrom/lib/render-assign.js');

const renderReg = require('./render-reg.js');
const renderSignal = require('./render-signal.js');

function renderAny (index, source, waveSkin) {

    affirmSourceConfig(source);

    const res = source.signal
        ? renderSignal(index, source, waveSkin)
        : source.assign
            ? renderAssign(index, source)
            : source.reg
                ? renderReg(index, source)
                : ['div', {}];

    // console.log (JSON.stringify(res, null, 3));
    res[1].class = 'WaveDrom';
    return res;
}
/* eslint no-console: 0 */

module.exports = renderAny;
