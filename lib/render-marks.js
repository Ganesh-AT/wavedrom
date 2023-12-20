'use strict';

const tspan = require('tspan');
const tt = require('onml/tt.js');
const getSignalRowCount = require('./get-signal-row-count.js');

function captext (cxt, anchor, y) {
    const txtobj = { 
        fill: '#000',
        'text-anchor': 'middle',
        'xml:space': 'preserve'
    };
    //if (uscalef !== 1) {
    //    txtobj['transform'] = 'scale(' + uscalef + ' 1)' ;
    //} 
    if (cxt[anchor] && cxt[anchor].text) {
        return [['g', tt(cxt.xmax * cxt.xs * cxt.downscale / 2, y), 
            ['text', txtobj].concat(tspan.parse(cxt[anchor].text))]];
    }
    return [];
}

function ticktock (cxt, ref1, ref2, x, dx, y, len) {
    let L = [];

    if (cxt[ref1] === undefined || cxt[ref1][ref2] === undefined) {
        return [];
    }

    let val = cxt[ref1][ref2];

    const requiredArrLen = Math.ceil(len + cxt.xmin_cfg) ;
    if (Array.isArray(val) && (val.length === 1)) {
        val = val[0] ;
    }
    const valType = (typeof val);
    if (valType === 'string') {
        val = val.trim().split(/\s+/);
    } else if (valType === 'number' || valType === 'boolean') {
        val = [...Array(requiredArrLen+1).keys()].map(a => (a + val));
    } else if (Array.isArray(val)) {
        if (val.length === 0) {
            return [];
        }
    }

    // By now, val must be an array, if not just return
    if (Array.isArray(val)) {
        val.splice(0, cxt.xmin_cfg/2);
    } else {
        return [];
    }
    L = val ;
    /*
    if (typeof val === 'string') {
        val = val.trim().split(/\s+/);
        console.log(JSON.stringify({val: val}));
    } else
        if (typeof val === 'number' || typeof val === 'boolean') {
            offset = Number(val);
            val = [];
            for (let i = 0; i < len; i += 1) {
                val.push(i + offset);
            }
        }
    if (Array.isArray(val)) {
        if (val.length === 0) {
            return [];
        } else if (val.length === 1) {
            offset = Number(val[0]);
            if (isNaN(offset)) {
                L = val;
            } else {
                for (let i = 0; i < len; i += 1) {
                    L[i] = +i + +offset;
                }
            }
        } else if (val.length === 2) {
            offset = Number(val[0]);
            const step = Number(val[1]);
            const tmp = val[1].split('.');
            let dp = 0;
            if (tmp.length === 2) {
                dp = tmp[1].length;
            }
            if (isNaN(offset) || isNaN(step)) {
                L = val;
            } else {
                offset = step * offset;
                for (let i = 0; i < len; i += 1) {
                    L[i] = (step * i + offset).toFixed(dp);
                }
            }
        } else {
            L = val;
        }
    } else {
        return [];
    }*/

    const res = ['g', {
        class: 'muted',
        'text-anchor': 'middle',
        'xml:space': 'preserve'
    }];
    const txtobj = {};
    for (let i = 0; i < len; i += 1) {
        if (cxt[ref1] && cxt[ref1].every && (i) % cxt[ref1].every != 0) {
            continue;
        }
        res.push( ['g', tt((i*dx + x) * cxt.downscale, y), 
            ['text', txtobj].concat(tspan.parse(L[i]))
        ]
        );
    }
    return [res];
} /* eslint complexity: [1, 30] no-console: 0 */

function renderMarks (content, index, lane, source) {
    const mstep  = 2 * (lane.hscale);
    const mmstep = mstep * lane.xs;
    const marks  = lane.xmax / mstep;
    const gy     = getSignalRowCount(content) * lane.yo;

    const res = ['g', {id: ('gmarks_' + index)}];
    const gmarkLines = ['g', {class: 'gmarks'}];
    
    if (source.config.marks) {
        for (let i = 0; i < (marks + 1); i += 1) {
            const marksGrpProps = {
                id: 'gmark_' + i + '_' + index,
                x1: (i * mmstep * lane.downscale), y1: 0,
                x2: (i * mmstep * lane.downscale), y2: gy
            };
            gmarkLines.push(['line', marksGrpProps]);
        }
        res.push(gmarkLines);
    }
    const headOffsetY = (lane.yh0 ? 33 : 13) + (lane.yh1 ? (lane.yh1 - 46) : 0);
    const footOffsetY = (lane.yf0 ? 45 : 25) ; // + (lane.yf1 ? (lane.yf1 - 46) : 0);
    return res.concat(
        // captext(lane, 'head', (lane.yh0 ? -33 : -13)),
        // captext(lane, 'foot', gy + (lane.yf0 ? 45 : 25)),
        captext(lane, 'head', -headOffsetY),
        captext(lane, 'foot', gy + footOffsetY),
        ticktock(lane, 'head', 'tick',          0, mmstep,      -5, marks + 1),
        ticktock(lane, 'head', 'tock', mmstep / 2, mmstep,      -5, marks),
        ticktock(lane, 'foot', 'tick',          0, mmstep, gy + 15, marks + 1),
        ticktock(lane, 'foot', 'tock', mmstep / 2, mmstep, gy + 15, marks)
    );
}

module.exports = renderMarks;
