'use strict';

const arcShape = require('./arc-shape.js');
const renderLabel = require('./render-label.js');
const safeEvalMathExpression = require('./safe-eval-math-expression.js');

const renderArc = (Edge, from, to, shapeProps) =>
    ['path', {
        id: 'gmark_' + Edge.fromTag + '_' + Edge.toTag,
        d: shapeProps.d || 'M ' + from.x + ',' + from.y + ' ' + to.x + ',' + to.y,
        class: ((shapeProps.klass || 'arc_default') + ' arc_path ' + Edge.arcClass),
        style: shapeProps.style
    }];

const updateEventCoords = (lane, Events, eventname, levelchar, xlabelToUse, poschar, transitionSlope, pos, tgtLane, currposX) => {

    if ((eventname !== '.') && (eventname !== undefined)) {

        let desiredLevelChar = Number('0x' + levelchar) ; // levelchar is [0,a] representing 10 levels from 0% to 100%
        let desiredLevelX = xlabelToUse ;   // x-coord at which transition is 50%
        let desiredLevelY = lane.ys * 0.5 ; // default y-coord for node placement

        let lcasePosChar = poschar.toLowerCase();
        let downSlope = (lcasePosChar === 'd');
        let upSlope = (lcasePosChar === 'u');
        // default y-coord is in the vertical middle of the brick
        // if poschar (u or d) is specified with upper case, default is retained
        // if poschar is u or d, then, y position is at path line in the transition

        // pre-threshold level setting is at 50$
        let desiredLevel = 0.5 ;
        if (!isNaN(desiredLevelChar)) { // suitable hex digit in tlevel string
            desiredLevel = (1.00 - ((desiredLevelChar > 10) ? 1 : (desiredLevelChar/10.00))) ;
            // [a-f] , desiredLevel is 0 (top of brick), else [0-9], it is at different thresholds
        }
        let slopeFactor = (transitionSlope / 2.00); // proportional to units taken for 0-1 or 1-0 transition
        let levelOffset = desiredLevel * transitionSlope ; // scale the desired threshold level with transition metric
        let finalNodeOffset = slopeFactor - levelOffset ; 
        desiredLevelX = xlabelToUse + (upSlope * finalNodeOffset) - (downSlope * finalNodeOffset) ; 
        // positive offset for upslope, negative offset for downslope to reflect final x position of node

        // Update desired y-coord for node based on threshold level if lower-case tpos is specified
        if (poschar === lcasePosChar) {
            desiredLevelY = lane.ys * desiredLevel ;
        }

        let currposXInt = lane.xs * (2 * pos - lane.phase) + desiredLevelX ;
        const maxposX = (lane.xmax_cfg - lane.xmin_cfg + 1) * lane.xs ;
        // Enqueue node coordinates only if it lies within the current hbounds, but 
        // send out update on current x position back to called regardless
        if ((currposXInt >= 0) && (currposXInt <= maxposX)) {
            Events[eventname] = {
                x: currposXInt,
                y: tgtLane * lane.yo + lane.y0 + desiredLevelY
            };
        }
        return [currposXInt] ;
    }
    return [currposX] ;
};

const labeler = (lane, Events) => (element) => {
    const text = element.node;
    const tlevel = element.node_tlevel ;
    const tpos = element.node_tpos ;
    // Expects node_tlevel and node_tpos to follow node string
    // node_tlevel values corresponding to node characters:
    // 0 - a : 0% to 100%
    // . (or any other character): 50%
    // node_tpos values corresponding to node characters:
    // u : consider tlevel as for 0m1 transition to determine (x,y) position
    // d : consider tlevel as for 1m0 transition to determine (x,y) position
    // U : consider tlevel as for 0m1 transition to determine x position (y = 0.5)
    // D : consider tlevel as for 1m0 transition to determine x position (y = 0.5)
    // m (or any other character): consider tlevel only for y position
    let subCycleMode = false ;
    let tgtLane = element.targetLane ;
    const xlabelToUse = (element.overrideSocket == undefined) ? lane.xlabel : Number(element.overrideSocket.x);
    // This is the x coordinate in the brick where the transition is at 50%
    const transitionSlope = (element.overrideSocket == undefined) ? 6 : Number(element.overrideSocket.rx) ;
    // Number of x units in the value transition - usually 6, but we have customized skin with slow rise / fall of 11 
    lane.period = element.period ? element.period : 1;
    lane.phase  = (element.phase ? element.phase * 2 : 0) + lane.xmin_cfg;
    if (text) {
        const stack = text.split('');
        const lstack = (typeof tlevel == 'undefined') ? [] : tlevel.split('');
        const pstack = (typeof tpos == 'undefined') ? [] : tpos.split('');
        let pos = 0;
        let currposX = 0 ;
        const maxposX = (lane.xmax_cfg - lane.xmin_cfg + 1) * lane.xs ;
        // +1 is for legacy hbounds compatibility
        while ((stack.length) && (currposX <= maxposX)) {
            let eventname = stack.shift();
            let levelchar = (lstack.length != 0) ? lstack.shift() : '.' ;
            let poschar = (pstack.length != 0) ? pstack.shift() : 'm' ;
            // Skip over the sub-cycle delimiters and ensure correct status (subcycle or not) is
            // inferred for the next non-delimiter character
            while ((eventname === '<') || (eventname === '>')) {
                subCycleMode = (eventname === '<') ? true : false ;
                eventname = stack.shift();
                levelchar = (lstack.length != 0) ? lstack.shift() : '.' ;
                poschar = (pstack.length != 0) ? pstack.shift() : 'm' ;
            }
            [currposX] = updateEventCoords (lane, Events, eventname, levelchar, 
                xlabelToUse, poschar, transitionSlope, pos, tgtLane, currposX) ;
            // For sub-cycle node characters, the x position is increased by only one brick 
            // (half a cycle when period = 1 and hscale = 1)
            // Regular node characters are placed (period*scale) apart
            pos += (subCycleMode ? 0.5 : (lane.period * lane.hscale));
        }
    }
};

const translateTDtoEventCoords = (tdCoords, lane, cfgScratchpad) => {

    const firstSplit = tdCoords.split(':');
    // It should be possible for the waveNum to be using the ID information for different 
    // signal names.
    const fs0Components = firstSplit[0].split(/(\+|-|\*|\/|\(|\))/) ;
    let fs0ToEval = '';
    fs0Components.map( (elem) => {
        const vldSignalId = elem.match(/^([a-z]|[A-Z]|_)([a-z]|[A-Z]|[0-9]|_)*$/);
        if (vldSignalId) {
            const actIdx = cfgScratchpad['id2LaneIdx'][elem] ;
            if (actIdx !== undefined) {
                fs0ToEval += (actIdx.toString());
            } else {
                fs0ToEval += '0';
            }
    } else {
            fs0ToEval += elem ;
    }
    } );
    const waveNum = safeEvalMathExpression(fs0ToEval);
    const secSplit = firstSplit[1].split(',');
    const unscaledX = safeEvalMathExpression(secSplit[0]);
    const unscaledY = (secSplit[1] === undefined) ? 0.5 : (1 - safeEvalMathExpression(secSplit[1])) ;

    const scalingFactor = 2 * lane.period * lane.hscale ;
    const maxposX = (lane.xmax_cfg - lane.xmin_cfg + 1) * lane.xs ;
    const scaledX = ((unscaledX * scalingFactor) - (lane.xmin_cfg)) * lane.xs ;
    // console.log(JSON.stringify({ x : scaledX, xmin_cfg : lane.xmin_cfg }));

    if ((scaledX >= 0) && (scaledX <= maxposX)) {
        return {
            x: scaledX * lane.downscale,
            y: (waveNum * lane.yo) + lane.y0  + (lane.ys * unscaledY)
        };
    } else {
        return undefined ;
    }

};

const archer = (res, Events, lane, customStyle, cfgScratchpad, index) => (element, edgeidx) => {
    const trimmedElem = element.trim();
    // TimingDiagramCoords = TDC
    // EdgeSpec ::= <NodeLabel-SingleChar><EdgeShape-StringNoSpace><NodeLabel-SingleChar>[\s<Label-StringOrTspan>]
    //      |
    //      \[<TDCSpec>\]<EdgeShape-StringNoSpace>\[<TDCSpec>\][<EdgeClassName-StringNoSpace>][\s<Label-StringOrTspan>]
    // TDCSpec ::= <LaneIdx-ZeroOrPositiveInteger>:<PeriodRelativeXPosition-Float>[,<LaneIdxRelativeYPosition-Float>]
    //      | <NodeLabel-SingleChar>
    const fChar = trimmedElem[0];
    let Edge = {};
    let fTag, tTag, fromCoords, toCoords ;
    if (fChar === '[') {
        // Attempt to get Event via timing diagram coords scheme
        const TDCSRegExp = new RegExp(/\[([^\]]*)\]([^[]*)\[([^\]]*)\]\[?([^(\s|\])]*)\]?\[?([^(\s|\])]*)\]?\s*([^\s].*|$)/);
        // -----------------------------[ TDCSpec ] shape  [ TDCSpec ] [ arcClass-Opt  ]  [arrowClass-Opt ]    label      --
        // Match[1] : recdCoords[0]
        // Match[2] : shape
        // Match[3] : recdCoords[1]
        // Match[4] : arcPath-CustomClass
        // Match[5] : arrowStyle-CustomClass
        // Match[6] : label
        const Match = trimmedElem.match(TDCSRegExp);
        fTag = (Match[1].length === 1) ? Match[1] : ('f_' + edgeidx) ;
        tTag = (Match[3].length === 1) ? Match[3] : ('t_' + edgeidx) ;
        fromCoords = (Match[1].length === 1) ? Events[Match[1]] : 
            translateTDtoEventCoords (Match[1], lane, cfgScratchpad);
        toCoords = (Match[3].length === 1) ? Events[Match[3]] : 
            translateTDtoEventCoords (Match[3], lane, cfgScratchpad);
        Edge = {
            label     : Match[6],
            fromTag   : fTag,
            toTag     : tTag,
            fromXY    : fromCoords,
            toXY      : toCoords,
            arcClass  : Match[4],
            arrowClass: Match[5],
            shape     : Match[2]
        };
    } else {
        // Legacy / traditional scheme with no way to specify arcPath class
        const words = trimmedElem.split(/\s+/);
        fTag = words[0].substr(0, 1);
        tTag = words[0].substr(-1, 1);
        fromCoords = Events[fTag];
        toCoords = Events[tTag];
        Edge = {
            label     : trimmedElem.substring(words[0].length).substring(1),
            fromTag   : fTag,
            toTag     : tTag,
            fromXY    : fromCoords,
            toXY      : toCoords,
            arcClass  : '',
            arrowClass: '',
            shape     : words[0].slice(1, -1)
        };
    }
    // console.log(JSON.stringify(Edge));
    if (fromCoords && toCoords) {
        // The customClass and customStyle args to arcShape are for the text label
        let shapeProps = arcShape(Edge, fromCoords, toCoords, '', customStyle);
        // console.log(JSON.stringify(shapeProps));
        const lx = shapeProps.lx;
        const ly = shapeProps.ly;
        shapeProps['style'] = '';
        // if shapeProps.klass.match('twosided') -> Both marker-start and marker-end with arrowhead and arrowtail
        // else if shapeProps.klass.match('arrow') -> Only marker-end with arrowhead
        // else if shapeProps.klass.match('bracket') -> Both marker-start and marker-end with with tee
        if ((Edge.arrowClass !== '') && (shapeProps.klass !== undefined)) {
            if (cfgScratchpad['markers2CloneWithAddedClass'] === undefined) {
                cfgScratchpad['markers2CloneWithAddedClass'] = [];                
            }
            // At SVG template insertion, these will be parsed to generate new markers
            // with id = "DX_arrowhead_EY" / "DX_arrowtail_EY" / "DX_tee_EY", 
            // where X = diagram index and Y = edgeidx
            cfgScratchpad['markers2CloneWithAddedClass'].push( {
                idx: edgeidx,
                class2Add: Edge.arrowClass
            } );
            const cRef = '#D' + index + '_' ;
            if (shapeProps.klass.match('twosided')) {
                shapeProps['style'] = ';marker-start:url(' + cRef + 'arrowtail_E' + edgeidx + 
                    ');marker-end:url(' + cRef + 'arrowhead_E' + edgeidx + ');';
            } else if (shapeProps.klass.match('arrow')) {
                shapeProps['style'] = ';marker-end:url(' + cRef + 'arrowhead_E' + edgeidx + ');';
            } else if (shapeProps.klass.match('bracket')) {
                shapeProps['style'] = ';marker-start:url(' + cRef + 'tee_E' + edgeidx + 
                    ');marker-end:url(' + cRef + 'tee_E' + edgeidx + ');';
            }
        }
        res.push(renderArc(Edge, fromCoords, toCoords, shapeProps));
        if (Edge.label) {
            res.push(renderLabel(
                {x: lx, y: ly}, Edge.label, 
                '', // customClass
                customStyle,
                1 // upscale factor
            ));
        }
    }
};

function renderArcs (lanes, index, source, lane) {
    const arcFontSize = source.config.arcFontSize ;
    const defBaseline = source.config.txtBaseline ;
    const res = ['g', {id: 'wavearcs_' + index}];
    const customStyle = ((arcFontSize !== undefined) ? (';font-size:' + arcFontSize + 'px;') : '') +
            ((defBaseline !== undefined) ? (';dominant-baseline:' + defBaseline + ';') : '') +
            ';text-anchor:middle;';
    const Events = {};
    if (Array.isArray(lanes)) {
        lanes.map(labeler(lane, Events));
        if (lane.downscale !== 1) {
            Object.keys(Events).map( k => { Events[k].x *= lane.downscale; } );
        }
        if (Array.isArray(source.edge)) {
            source.edge.map(archer(res, Events, lane, customStyle, source.config.wdScratchpad, index));
        }
        Object.keys(Events).map(function (k) {
            // lower-case node specifiers have to be displayed explicitly in the diagram
            if (k === k.toLowerCase()) {
                if (Events[k].x > 0) {
                    res.push(renderLabel(
                        {x: Events[k].x, y: Events[k].y}, 
                        k + '', 
                        '', // customClass
                        customStyle,
                        1 // upscale factor
                    ));
                }
            }
        });
    }
    return res;
}
/* eslint no-console: 0 */

module.exports = renderArcs;
