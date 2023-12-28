'use strict';

const tt = require('onml/tt.js');

function renderGapUses (text, lane, masterSkin = 'default') {
    const res = [];
    const Stack = (text || '').split('');
    let numRegularNodes = 0 ;
    let numSubCycleNodes = 0 ;
    let xlatedPos = 0 ;
    let pos = 0;
    let subCycle = false;
    let tempSkin = masterSkin ;
    let gapPhase = lane.addGapsPhase ;
    if (typeof lane.overrideSkin != 'undefined') {
        tempSkin = lane.overrideSkin ;
    }

    while (Stack.length) {
        let next = Stack.shift();
        // Skip over the sub-cycle delimiters and ensure correct status (subcycle or not) is
        // inferred for the next non-delimiter character
        while ((next === '<') || (next === '>')) {
            subCycle = (next === '<') ? true : false ;
            next = Stack.shift();
        }
        if (subCycle) {
            numSubCycleNodes ++ ;
        } else {
            numRegularNodes ++ ;
        }
        if (next === '|') {
            // subCycleNodes are rendered with a single brick, and should not be subject to hscale or period
            // regularNodes are rendered based on both the period and scale
            pos = numSubCycleNodes + (((numRegularNodes * 2 * lane.period) - (subCycle ? 0 : lane.period)) * lane.hscale) ;
            // When rendering gaps in subCycle mode, the gap is placed right at the end of the single brick
            // In regular mode, we need to offset by a single period to make it appear in the middle of the cycle
            // The subCycle term in the above assignment handles that aspect
            xlatedPos = lane.xs * (pos - lane.phase - gapPhase - (lane.xmin_cfg)) ;
            const maxXlatedPos = (lane.xmax_cfg + 1 - lane.xmin_cfg) * lane.xs ;
            if ((xlatedPos >= 0) && (xlatedPos <= maxXlatedPos)) {
                res.push(['use', tt(
                    xlatedPos,
                    0,
                    {'xlink:href': '#wd_' + tempSkin + '_gap'}
                )]);
            }
        }
    }
    return res;
}

function renderGaps (lanes, index, source, lane) {
    let res = [];
    let maxRenderedLaneNum = 0 ;
    const masterSkin = source.config.skin ;
    if (lanes) {
        const lanesLen = lanes.length;
        const vline = (x) => ['line', {
            x1: x, x2: x,
            y2: lanesLen * lane.yo,
            style: 'stroke:#000;stroke-width:1px'
        }];
        const lineStyle = 'fill:none;stroke:#000;stroke-width:1px';
        const bracket = {
            square: {
                left:  ['path', {d: 'M  2 0 h -4 v ' + (lanesLen * lane.yo - 1) + ' h  4', style: lineStyle}],
                right: ['path', {d: 'M -2 0 h  4 v ' + (lanesLen * lane.yo - 1) + ' h -4', style: lineStyle}]
            },
            round: {
                left:      ['path', {d: 'M  2 0 a 4 4 0 0 0 -4 4 v ' + (lanesLen * lane.yo - 9) + ' a 4 4 0 0 0  4 4', style: lineStyle}],
                right:     ['path', {d: 'M -2 0 a 4 4 1 0 1  4 4 v ' + (lanesLen * lane.yo - 9) + ' a 4 4 1 0 1 -4 4', style: lineStyle}],
                rightLeft: ['path', {
                    d:  'M -5 0 a 4 4 1 0 1  4 4 v ' + (lanesLen * lane.yo - 9) + ' a 4 4 1 0 1 -4 4' +
                        'M  5 0 a 4 4 0 0 0 -4 4 v ' + (lanesLen * lane.yo - 9) + ' a 4 4 0 0 0  4 4',
                    style: lineStyle
                }],
                leftLeft: ['path', {
                    d:  'M  2 0 a 4 4 0 0 0 -4 4 v ' + (lanesLen * lane.yo - 9) + ' a 4 4 0 0 0  4 4' +
                        'M  5 1 a 3 3 0 0 0 -3 3 v ' + (lanesLen * lane.yo - 9) + ' a 3 3 0 0 0  3 3',
                    style: lineStyle
                }],
                rightRight: ['path', {
                    d:  'M -5 1 a 3 3 1 0 1  3 3 v ' + (lanesLen * lane.yo - 9) + ' a 3 3 1 0 1 -3 3' +
                        'M -2 0 a 4 4 1 0 1  4 4 v ' + (lanesLen * lane.yo - 9) + ' a 4 4 1 0 1 -4 4',
                    style: lineStyle
                }]
            }
        };
        const backDrop = (w) => ['rect', {
            x: -w / 2,
            width: w,
            height: lanesLen * lane.yo,
            style: 'fill:#ffffffcc;stroke:none'
        }];
        if (source && typeof source.gaps === 'string') {
            const scale = lane.hscale * lane.xs * 2;
            const gaps = source.gaps.trim().split(/\s+/);
            for (let x = 0; x < gaps.length; x++) {
                const c = gaps[x];
                if (c.match(/^[.]$/)) {
                    continue;
                }
                const offset = (c === c.toLowerCase()) ? 0.5 : 0;
                let marks = [];
                switch(c) {
                case '0': marks = [backDrop(4)]; break;
                case '1': marks = [backDrop(4), vline(0)]; break;
                case '|': marks = [backDrop(4), vline(0)]; break;
                case '2': marks = [backDrop(4), vline(-2), vline(2)]; break;
                case '3': marks = [backDrop(6), vline(-3), vline(0), vline(3)]; break;
                case '[': marks = [backDrop(4), bracket.square.left]; break;
                case ']': marks = [backDrop(4), bracket.square.right]; break;
                case '(': marks = [backDrop(4), bracket.round.left]; break;
                case ')': marks = [backDrop(4), bracket.round.right]; break;
                case ')(': marks = [backDrop(8), bracket.round.rightLeft]; break;
                case '((': marks = [backDrop(8), bracket.round.leftLeft]; break;
                case '))': marks = [backDrop(8), bracket.round.rightRight]; break;
                case 'S':
                case 's':
                    for (let idx = 0; idx < lanesLen; idx++) {
                        if (lanes[idx] && lanes[idx].wave && 
                            (lanes[idx].wave.length > x) && 
                            (lanes[idx].targetLane === idx)
                        ) {
                            marks.push(['use', tt(2, 5 + lane.yo * idx, {'xlink:href': '#wd_' + masterSkin + '_gap'})]);
                        }
                    }
                    break;
                }
                const gapsXPos = scale * (x + offset - (lane.xmin_cfg / 2)) ;
                const maxXPos = 0.5 * scale * (lane.xmax_cfg + 1) ;
                if ((gapsXPos >= 0) && (gapsXPos <= maxXPos)) {
                    res.push(['g', tt(gapsXPos)].concat(marks));
                }
            }
        }
        for (let idx = 0; idx < lanesLen; idx++) {
            const val = lanes[idx];
            lane.period = val.period ? val.period : 1;
            lane.phase  = (val.phase  ? val.phase * 2 : 0); // + lane.xmin_cfg;
            lane.addGapsPhase = 0 ;
            if (typeof val.addGapsPhase != 'undefined') {
                lane.addGapsPhase = val.addGapsPhase;
            }
            if (typeof val.wave === 'string') {
                const gaps = renderGapUses(val.wave, lane, masterSkin);
                let laneNum = val.targetLane ;
                if (laneNum > maxRenderedLaneNum) {
                    maxRenderedLaneNum = laneNum ;
                }
                res = res.concat([['g', tt(
                    0,
                    lane.y0 + laneNum * lane.yo,
                    {id: 'wavegap_' + idx + '_' + index}
                )].concat(gaps)]);
            }
        }
    }
    const gapsGroupProps = {
        id: 'wavegaps_' + index
    };
    if (lane.downscale !== 1) {
        gapsGroupProps['transform'] = 'scale(' + lane.downscale + ' 1)';
    }
    return ['g', gapsGroupProps].concat(res);
} /* eslint complexity: [1, 100] */

module.exports = renderGaps;
